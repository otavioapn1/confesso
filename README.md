# Confesso

App mobile anônimo para compartilhar segredos, inspirado no antigo "Secret".

## Tecnologias
- React Native (Expo)
- Firebase (Firestore)
- React Navigation
- Tailwind-RN

## Configuração

1. **Firebase:**
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
   - Crie um banco de dados Firestore (modo test para dev).
   - Copie as credenciais do seu app web e substitua no arquivo `firebase.js`:
     ```js
     const firebaseConfig = {
       apiKey: 'YOUR_API_KEY',
       authDomain: 'YOUR_AUTH_DOMAIN',
       projectId: 'YOUR_PROJECT_ID',
       storageBucket: 'YOUR_STORAGE_BUCKET',
       messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
       appId: 'YOUR_APP_ID',
     };
     ```

2. **Tailwind-RN:**
   - Para adicionar novas classes, edite `tailwind.config.js` e rode:
     ```sh
     npx tailwind-rn
     ```

3. **Rodando o app:**
   ```sh
   npm install
   npx expo start
   ```
   - Use o Expo Go no celular para testar.

## Funcionalidades
- Feed de segredos
- Postar segredo
- Comentar anonimamente
- Denunciar segredo/comentário
- Moderação automática de palavras ofensivas
- Curtir segredos

## 100% Anônimo

O app não exige login, cadastro ou autenticação. Basta abrir e usar!

---

**Expansível e pronto para produção!**
