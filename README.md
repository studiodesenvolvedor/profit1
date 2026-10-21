# ProFit Up — versão mobile e Firebase Authentication

Site estático para GitHub Pages. Mantém o projeto Firebase vm-variedades-ae402,
o banco Realtime Database e o caminho profitup/preinscricoes dos arquivos originais.

## 1. Ativar o login no Firebase

1. Entre em https://console.firebase.google.com/ e abra vm-variedades-ae402.
2. Abra Criação (Build) > Authentication > Começar (Get started), se aparecer.
3. Em Método de login (Sign-in method), abra E-mail/senha, ative a primeira
   opção de e-mail e senha e salve. O login por link de e-mail não é necessário.
4. Na aba Usuários (Users), clique em Adicionar usuário. Informe o e-mail do
   administrador e defina uma senha forte diretamente no console. Não coloque
   a senha no código, no GitHub ou em mensagens. Copie o UID do usuário criado.
5. Abra Authentication > Configurações > Domínios autorizados e adicione
   studiodesenvolvedor.github.io, sem https:// e sem /profit1/. Se já existir,
   mantenha. Adicione outros domínios somente quando forem usados por este site.

## 2. Autorizar esse usuário no banco

Authentication identifica quem entrou; a autorização de administrador está
no Realtime Database. Somente criar o usuário não libera os cadastros.

1. Abra Criação > Realtime Database > Dados, no banco já usado pela academia.
2. Dentro de profitup, crie admins, se ainda não existir.
3. Dentro de admins, crie uma chave com o UID exato copiado do Authentication.
4. Defina o valor como true do tipo BOOLEANO, sem aspas.

Exemplo de estrutura (substitua o texto pelo UID real):

    profitup
      admins
        UID_REAL_DO_USUARIO: true
      preinscricoes
        ...cadastros existentes...

Adicione somente o novo filho. Não importe JSON na raiz e não substitua o
conteúdo de profitup, pois isso pode apagar os cadastros existentes.
A liberação de administradores acontece apenas no console, não pelo site.
Para revogar, remova o filho do UID ou defina seu valor como false.

## 3. Publicar as regras do Realtime Database

O arquivo firebase-database.rules.json é para o Realtime Database, não Firestore.

1. Abra Realtime Database > Regras e salve uma cópia das regras atuais.
2. Se o banco é exclusivo deste site, copie o conteúdo do arquivo e publique.
3. Se esse projeto também atende outro site (por exemplo, VM Variedades),
   integre apenas o bloco profitup às regras atuais, preservando os demais
   caminhos. As permissões .read e .write na raiz e nos ancestrais de profitup
   não podem liberar acesso público: permissões no pai prevalecem nas regras
   filhas. Se houver essa liberação, restrinja cada aplicação no seu próprio
   caminho antes de publicar. Não sobrescreva regras de outras aplicações.
4. No simulador de regras, confirme: leitura anônima negada; leitura por usuário
   autenticado sem admins/UID=true negada; leitura por administrador permitida.
   Confira também que o usuário não pode gravar em admins e que uma pré-inscrição
   nova válida é aceita sem permitir leitura, alteração ou exclusão pública.

As regras permitem criar uma pré-inscrição com os campos esperados e data do
servidor. Não permitem sobrescrever ou excluir o cadastro pelo site. A leitura
é exclusiva dos administradores autorizados. A configuração firebase-config.js
é pública e não contém senha de administrador. O formulário público aceita
cadastros anônimos; estas regras validam dados, mas não limitam abuso automatizado.

## 4. Atualizar o GitHub

1. Extraia o ZIP e abra o repositório studiodesenvolvedor/profit1.
2. Envie index.html, mobile.css, admin.html, admin.css, admin.js,
   preinscricao.js e firebase-config.js à raiz. Envie assets com a estrutura
   preservada. Incluímos as fotos e a logo originais no pacote.
3. Confirme as alterações (Commit changes). O index.html deve ficar na raiz,
   sem uma pasta extra envolvendo os arquivos. Não envie somente o ZIP.
4. Aguarde a publicação do GitHub Pages. Atualize a página para carregar os
   arquivos novos. No computador, use Ctrl+F5.

firebase-database.rules.json e este README são referência de configuração;
o GitHub Pages não publica regras automaticamente no Firebase.

## 5. Conferir o funcionamento

- Abra o site no celular e confira menu, planos e pré-inscrição.
- Faça uma pré-inscrição de teste identificada como tal e confirme o envio.
- Abra admin.html pelo link Área do administrador no rodapé.
- Entre com o usuário criado. A senha nunca fica no código.
- Confirme que o cadastro de teste aparece com o plano e a data corretos.
- Confira busca, filtro, WhatsApp e Sair. A sessão dura enquanto a aba estiver
  aberta; dados não ficam disponíveis no painel após sair ou perder autorização.
- Para recuperar a senha, preencha seu e-mail e use Esqueci minha senha.

O painel mostra até 500 pré-inscrições mais recentes, em ordem decrescente,
com 20 por página e horários de Brasília. Dados anteriores continuam no banco.
Não há cadastro público de administradores nem botão para apagar pré-inscrições.

Para testar localmente, use um servidor HTTP, por exemplo:

    python3 -m http.server 8000

Não abra os arquivos por duplo clique. O login carrega o SDK oficial do Firebase
via gstatic.com e depende de internet. O formulário público continua usando o
Realtime Database por HTTPS, sem servidor adicional.

## Limite da validação desta entrega

O layout e os fluxos do painel foram verificados localmente com respostas
simuladas. Ativar o provedor, criar usuário, autorizar UID e publicar as regras
são etapas do console. O login real e o envio real precisam ser conferidos após
essas etapas; nenhuma conta ou senha foi criada automaticamente.

Documentação oficial:
- https://firebase.google.com/docs/auth/web/password-auth
- https://firebase.google.com/docs/auth/web/manage-users
- https://firebase.google.com/docs/database/security/rules-conditions
