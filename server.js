import express from "express";
import multer from "multer";
import nodemailer from "nodemailer";
import cors from "cors";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do multer (uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s/g, "_"));
  },
});
const upload = multer({ storage });

// Endpoint para receber formulário
app.post(
  "/submit",
  upload.fields([
    { name: "documento_pesquisa", maxCount: 1 },
    { name: "curriculo", maxCount: 1 },
    { name: "declaracao_orientador", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const data = req.body;
      const files = req.files;

      console.log("📩 Dados recebidos:", data);
      console.log("📎 Arquivos recebidos:", files);

      // Transporter do Nodemailer
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // 📧 Email para o usuário (confirmação)
      await transporter.sendMail({
        from: `"BioIn - Inscrição" <${process.env.SMTP_USER}>`,
        to: data.email,
        subject: "Confirmação de Inscrição - BioIn",
        text: `Olá ${data.nome_completo}, recebemos sua inscrição com sucesso!`,
      });

      // 📧 Email para a equipe com anexos
      const attachments = [];
      if (files.documento_pesquisa) {
        attachments.push({ path: files.documento_pesquisa[0].path });
      }
      if (files.curriculo) {
        attachments.push({ path: files.curriculo[0].path });
      }
      if (files.declaracao_orientador) {
        attachments.push({ path: files.declaracao_orientador[0].path });
      }

      await transporter.sendMail({
        from: `"BioIn - Sistema" <${process.env.SMTP_USER}>`,
        to: "institutodesaudemultiprofissio@gmail.com", // 👉 Trocar pelo email real da equipe
        subject: "Nova Inscrição Recebida",
        text: `
          Nome: ${data.nome_completo}
          Email: ${data.email}
          Telefone: ${data.telefone}
          Instituição: ${data.instituicao}
          Cargo/Função: ${data.cargo_funcao}
          Título da Pesquisa: ${data.titulo_pesquisa}
          Categoria: ${data.categoria_pesquisa}
          Coautores: ${data.coautores}
          Resumo: ${data.resumo_pesquisa}
        `,
        attachments,
      });

      res.json({ message: "Inscrição enviada com sucesso!" });
    } catch (error) {
      console.error("❌ Erro:", error);
      res.status(500).json({ error: "Erro ao processar inscrição" });
    }
  }
);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
