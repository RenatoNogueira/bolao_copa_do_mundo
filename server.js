require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// Middleware de Autenticação
const requireAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader === `Bearer ${ADMIN_TOKEN}`) {
        next();
    } else {
        res.status(401).json({ error: 'Acesso Negado' });
    }
};

// Configuração do Multer para Uploads
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        // Remover espaços e caracteres estranhos
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
        cb(null, Date.now() + '-' + safeName);
    }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rotas limpas para as views
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/painel', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// MySQL Pool Connection
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize MySQL tables
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pix VARCHAR(255),
                valor DECIMAL(10, 2)
            )
        `);
        
        const [rows] = await pool.query('SELECT * FROM config WHERE id = 1');
        if (rows.length === 0) {
            await pool.query('INSERT INTO config (id, pix, valor) VALUES (1, "", 0)');
        }

        await pool.query(`
            CREATE TABLE IF NOT EXISTS jogos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                data VARCHAR(255),
                adversario VARCHAR(255),
                local VARCHAR(255),
                gols_brasil INT DEFAULT NULL,
                gols_adversario INT DEFAULT NULL,
                apurado BOOLEAN DEFAULT FALSE
            )
        `);
        
        // Tentativa segura de adicionar as colunas se a tabela já existir e estiver usando o schema antigo
        try { await pool.query('ALTER TABLE jogos ADD COLUMN gols_brasil INT DEFAULT NULL'); } catch(e) {}
        try { await pool.query('ALTER TABLE jogos ADD COLUMN gols_adversario INT DEFAULT NULL'); } catch(e) {}
        try { await pool.query('ALTER TABLE jogos ADD COLUMN apurado BOOLEAN DEFAULT FALSE'); } catch(e) {}

        await pool.query(`
            CREATE TABLE IF NOT EXISTS palpites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                jogo_id INT,
                nome VARCHAR(255),
                telefone VARCHAR(255),
                gols_brasil INT,
                gols_adversario INT,
                comprovante VARCHAR(255),
                confirmado BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (jogo_id) REFERENCES jogos(id) ON DELETE CASCADE
            )
        `);
        console.log("Banco de dados MySQL inicializado e tabelas garantidas.");
    } catch (e) {
        console.error("Erro ao inicializar o banco de dados MySQL:", e);
    }
}

initDB();

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        res.json({ success: true, token: ADMIN_TOKEN });
    } else {
        res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }
});

app.get('/api/config', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT pix, valor FROM config WHERE id = 1');
    if (rows.length > 0) {
        res.json({ pix: rows[0].pix || '', valor: parseFloat(rows[0].valor) || 0 });
    } else {
        res.json({ pix: '', valor: 0 });
    }
  } catch (error) {
    console.error('Erro /api/config GET:', error);
    res.json({ pix: '', valor: 0 });
  }
});

app.post('/api/config', requireAdmin, async (req, res) => {
  try {
    const { pix, valor } = req.body;
    await pool.query('UPDATE config SET pix = ?, valor = ? WHERE id = 1', [pix, valor]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro /api/config POST:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

app.get('/api/jogos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM jogos ORDER BY data ASC');
    
    // Para cada jogo apurado, buscar ganhadores
    for (let i = 0; i < rows.length; i++) {
        const jogo = rows[i];
        if (jogo.apurado) {
            const [winners] = await pool.query(`
                SELECT nome FROM palpites 
                WHERE jogo_id = ? AND confirmado = TRUE 
                AND gols_brasil = ? AND gols_adversario = ?
            `, [jogo.id, jogo.gols_brasil, jogo.gols_adversario]);
            
            jogo.ganhadores = winners.map(w => w.nome);
        }
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Erro GET jogos:', error);
    res.json([]);
  }
});

app.post('/api/jogos', requireAdmin, async (req, res) => {
  try {
    const { data, adversario, local } = req.body;
    const [result] = await pool.query('INSERT INTO jogos (data, adversario, local) VALUES (?, ?, ?)', [data, adversario, local]);
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Erro /api/jogos POST:', error);
    res.status(500).json({ error: 'Erro ao salvar jogo' });
  }
});

app.delete('/api/jogos/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM jogos WHERE id = ?', [id]);
    
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Jogo não encontrado' });
    }
  } catch (error) {
    console.error('Erro /api/jogos DELETE:', error);
    res.status(500).json({ error: 'Erro ao excluir jogo' });
  }
});

app.post('/api/palpites', upload.single('comprovante'), async (req, res) => {
  try {
    const { jogo_id, nome, telefone, gols_brasil, gols_adversario } = req.body;
    const comprovanteUrl = req.file ? `/uploads/${req.file.filename}` : 'Sem comprovante';
    
    await pool.query(
        'INSERT INTO palpites (jogo_id, nome, telefone, gols_brasil, gols_adversario, comprovante, confirmado) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [jogo_id, nome, telefone, gols_brasil, gols_adversario, comprovanteUrl, false]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Erro /api/palpites POST:', error);
    res.status(500).json({ error: 'Erro ao salvar palpite' });
  }
});

app.get('/api/palpites', async (req, res) => {
  try {
    const { telefone } = req.query;
    let query = 'SELECT * FROM palpites ORDER BY id DESC';
    
    const [rows] = await pool.query(query);
    let palpites = rows;
    
    if (telefone) {
        const qTelefone = String(telefone).replace(/\D/g, '');
        palpites = palpites.filter(r => {
            const pTelefone = r.telefone ? String(r.telefone).replace(/\D/g, '') : '';
            return pTelefone === qTelefone;
        });
    }
    
    const resultadoFormatado = palpites.map(r => ({
        row: r.id, // Compatibilidade com frontend que usa .row
        jogo_id: r.jogo_id,
        nome: r.nome,
        telefone: r.telefone,
        gols_brasil: r.gols_brasil,
        gols_adversario: r.gols_adversario,
        comprovante: r.comprovante,
        confirmado: !!r.confirmado
    }));
    
    res.json(resultadoFormatado);
  } catch (error) {
    console.error('Erro GET palpites:', error);
    res.status(500).json({ error: 'Erro' });
  }
});

app.post('/api/palpites/:row/confirmar', requireAdmin, async (req, res) => {
  try {
    const { row } = req.params;
    const { confirmado } = req.body; // true or false
    
    const [result] = await pool.query('UPDATE palpites SET confirmado = ? WHERE id = ?', [confirmado, row]);

    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Palpite não encontrado' });
    }
  } catch (error) {
    console.error('Erro confirmar palpite:', error);
    res.status(500).json({ error: 'Erro ao confirmar' });
  }
});

app.post('/api/jogos/:id/apurar', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { gols_brasil, gols_adversario } = req.body;
      
      const [result] = await pool.query(
          'UPDATE jogos SET gols_brasil = ?, gols_adversario = ?, apurado = TRUE WHERE id = ?', 
          [gols_brasil, gols_adversario, id]
      );
  
      if (result.affectedRows > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Jogo não encontrado' });
      }
    } catch (error) {
      console.error('Erro publicar resultado:', error);
      res.status(500).json({ error: 'Erro ao publicar resultado' });
    }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log('Armazenamento via MySQL (FreeSQLDatabase) Ativo.');
});
