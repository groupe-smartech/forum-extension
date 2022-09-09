// chrome-extension://hdcijkfabacndhjlljkdaofdanpfffee/pages/popup.html

document.getElementById('loginForm').addEventListener("submit", function(event){
    event.preventDefault();
    login(document.getElementById('login_username').value, document.getElementById('login_password').value);
});

document.getElementById('logoutBtn').addEventListener("click", function(){ logout() });

init();