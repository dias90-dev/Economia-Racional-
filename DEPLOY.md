# Guia de Deploy e Exportação

Seu aplicativo está pronto para ser publicado em várias plataformas. Abaixo você encontra as instruções para os serviços que você solicitou. Todos os arquivos de configuração necessários já foram gerados.

## 1. GitHub
Para levar o código ao GitHub:
1. Em seu terminal, navegue até a pasta do projeto.
2. Inicie o git: `git init`
3. Adicione tudo: `git add .`
4. Crie o commit: `git commit -m "Versão Inicial"`
5. Adicione seu repositório remoto: `git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git`
6. Envie o código: `git push -u origin main`

## 2. Vercel
O arquivo `vercel.json` foi configurado para suportar Single Page Applications (SPA).
* **Fácil**: Acesse [vercel.com](https://vercel.com/), importe seu repositório do GitHub, a Vercel detectará que é um projeto Vite automaticamente.
* **CLI**: No terminal rode `npx vercel` na raiz do projeto.

## 3. Firebase Hosting
O arquivo `firebase.json` está unificado para regras de Firestore e o Hosting (SPA fallback já configurado).
1. Certifique-se de instalar o Firebase CLI: `npm install -g firebase-tools`
2. Faça o login: `firebase login`
3. Troque o projeto no arquivo `.firebaserc` ou rode `firebase use SEU_PROJECT_ID`.
4. Faça o deploy: `firebase deploy`

## 4. Render
O arquivo `render.yaml` descreve a infraestrutura como código (IaC) (neste caso web estático).
1. No dashboard da [Render](https://render.com/), vá em "New" -> "Blueprint".
2. Conecte com seu repositório GitHub.
3. O Render vai ler o `render.yaml` e criar seu serviço estático automaticamente contendo as regras de reescrita para as rotas funcionarem perfeitamente.

## 5. UptimeRobot
Como nosso aplicativo agora opera de maneira serveless/SPA client-side:
1. Após hospedar o aplicativo (na Vercel, Firebase ou Render), copie a URL Pública.
2. Crie uma conta no [UptimeRobot](https://uptimerobot.com/).
3. Adicione um novo monitor do tipo `HTTP(s)`, cole sua URL.
4. O UptimeRobot fará uma requisição a cada 5 minutos garantindo que sua SPA está viva. (Útil para verificar SLAs do provedor escolhido).

## 6. Android APK (Capacitor)
O serviço oficial Ionic Capacitor já está instalado e inicializado (`capacitor.config.ts`). Para converter seu App web em um Android APK:
1. Gere a última build pra produção: `npm run build`
2. Adicione a plataforma Android se ainda não tiver: `npx cap add android`
3. Para compilar em sua máquina local e abrir o Android Studio, use:
   `npm run build:android`
   `npx cap open android`
4. De dentro do Android Studio, vá em **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
