import express from "express";
import multer from "multer";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const app = express();

// Multer: usa memória para armazenar arquivos temporariamente
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.json());

// Rota do formulário
app.post(
  "/submit",
  upload.fields([
    { name: "documento_pesquisa", maxCount: 1 },
    { name: "curriculo", maxCount: 1 },
    { name: "declaracao_orientador", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files;
      const body = req.body;

      if (
        !files ||
        !files.documento_pesquisa ||
        !files.curriculo ||
        !files.declaracao_orientador
      ) {
        return res
          .status(400)
          .json({ error: "Todos os arquivos são obrigatórios." });
      }

      // --- Configuração do Nodemailer ---
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Email de agradecimento ao usuário
      await transporter.sendMail({
        from: `"Instituto de Saúde Multiprofissional" <${process.env.SMTP_USER}>`,
        to: body.email,
        subject: "Confirmação de Inscrição - Premio Dr Dacio Campos",
        text: `Olá ${body.nome_completo},\n\nRecebemos sua inscrição com sucesso!
        
         Em breve entraremos em contato.\n\nAtenciosamente,\nInstituto de Saúde Multiprofissional`,
      });

      // Email para equipe com dados + anexos
      await transporter.sendMail({
        from: `"Instituto de Saúde Multiprofissional" <${process.env.SMTP_USER}>`,
        to: "institutodesaudemultiprofissio@gmail.com", // substitua pelo e-mail da equipe
        subject: `Premio Dr Dacio Campos Nova Inscrição Recebida: : ${body.nome_completo}`,
        text: `
         Dados do Participante:
         Nome: ${body.nome_completo}
         Email: ${body.email}
         Telefone: ${body.telefone}
         Instituição: ${body.instituicao}
         Cargo/Função: ${body.cargo_funcao}
         Título da pesquisa: ${body.titulo_pesquisa}
         Categoria: ${body.categoria_pesquisa}
         Coautores: ${body.coautores}
         Resumo: ${body.resumo_pesquisa}
        `,
        attachments: [
          {
            filename: files.documento_pesquisa[0].originalname,
            content: files.documento_pesquisa[0].buffer,
          },
          {
            filename: files.curriculo[0].originalname,
            content: files.curriculo[0].buffer,
          },
          {
            filename: files.declaracao_orientador[0].originalname,
            content: files.declaracao_orientador[0].buffer,
          },
        ],
      });

      return res.json({
        success: true,
        message: "Inscrição enviada com sucesso!",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao processar inscrição." });
    }
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
