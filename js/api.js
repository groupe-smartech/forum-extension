//////////////////// DÉMARRAGE ////////////////////
var user = [];
// remplacer par solution qui marche aussi sur autres navigateurs
chrome.storage.sync.get(["username", "password", "profilepic"], function(data){
  user["username"] = data['username'];
  user["password"] = data['password'];
  user["profilepic"] = data['profilepic'];
});



//////////////////// FONCTIONS ////////////////////
var chatTimer, notifTimer, messageTimer;
function init() {
  if (user['username'] !== undefined) {
    setTimeout(function(){ callAPI("POST", "readchat", user["username"], user["password"], updateChat); }, 1000);
    chatTimer = window.setInterval(function() { callAPI("POST", "readchat", user["username"], user["password"] , updateChat); }, 2000);
    setTimeout(function(){ callAPI("GET", "alerts/", user["username"], user["password"], updateNotifs); }, 5000);
    notifTimer = window.setInterval(function() { callAPI("GET", "alerts/", user["username"], user["password"], updateNotifs); }, 10000);
    setTimeout(function(){ callAPI("GET", "conversations/", user["username"], user["password"], updateMessages); }, 10000);
    messageTimer = window.setInterval(function() { callAPI("GET", "conversations/", user["username"], user["password"], updateMessages); }, 10000);
    document.getElementById('profilePic').src = user['profilepic'];

  } else {
    logout();

  }
}

function reset() {
    clearInterval(chatTimer);
    clearInterval(notifTimer);
    clearInterval(messageTimer);
}

function callAPI(method, scope, login, password, callback) {
  password = btoa(password);
  $.ajax({
    url: "/api.php",
    type: "POST",
    data: { scope: scope,
            method: method,
            login: login,
            password: password
          },
    success: function(data) {
      // console.log("call");
      // console.log(scope, data);
      callback(JSON.parse(data));
    }
  }).fail(function() {
    reset();
    $('.online').hide();
    $('.offline').show();
  });
}

function login(username, password) {
  $('.loginInput').removeClass("is-invalid");
  callAPI("POST", "auth/", username, password, function(data) {
    if (data['errors']) {
      $('.loginInput').addClass("is-invalid");

    } else {
      console.log(username);
      user["username"] = username;
      user["password"] = password;
      user["profilepic"] = data["user"]["avatar_urls"]["s"];
      // document.getElementById('profilePic').src = user["profilepic"];
      chrome.storage.sync.set({ "username": username, "password": password, "profilepic": user["profilepic"] }, function() {
        $('.loggedOut').hide();
        $('.loggedIn').show();
        init();
      });

    }
  });
}

function logout() {
  chrome.storage.sync.remove(["username", "password", "profilepic"], function() {
    reset();
    $('.loggedIn').hide();
    $('.loggedOut').show();
  });
}

function format_time(UNIX_timestamp) {     
    var a = new Date(UNIX_timestamp * 1000);
    var today = new Date();
    var yesterday = new Date(Date.now() - 86400000);
    var months = ['janv','fev','mars','avr','mai','juin','juil','août','sept','oct','nov','dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    if (a.setHours(0,0,0,0) == today.setHours(0,0,0,0))
        return "Aujourd'hui à " + hour + ":" + min;
    else if (a.setHours(0,0,0,0) == yesterday.setHours(0,0,0,0))
        return "Hier à " + hour + ":" + min;
    else if (year == today.getFullYear())
        return date + " " + month + ", " + hour + ":" + min;
    else
        return date + " " + month + " " + year + ", " + hour + ":" + min;
}

function updateScroll(){
    var element = document.getElementById("adoasischat");
    element.scrollTop = element.scrollHeight;
}



//////////////////// CHAT ////////////////////
var chat_stored;
function updateChat(data) {
  // Faire autrement : si la nvelle requete contient de nouveaux arrays, garder les nouveaux et les append au chat (pour que les anciens msg restent affichés)
  data = data.reverse();
  var result = "";

  for (var msg in data) {
    if (data[msg]["message_type"] != "thread") {
      var username = "<a href='https://adoasis.fr/m" + data[msg]["message_user_id"] + "' target='_blank'>" + data[msg]["message_username"] + "</a> - ";
    } else {
      var username = "";
    }

    if (data[msg]["message_like_count"] > 0)  {
      var likes = " <a class='text-primary'>" + data[msg]["message_like_count"] + "❤</a>";
    } else {
      var likes = "";
    }
    
    result += username + bbcodeParser.bbcodeToHtml(data[msg]["message_text"]) + likes + "<br>";
  }
  if (result !== chat_stored) {
    document.getElementById('adoasischat').innerHTML = result;
    chat_stored = result;
    updateScroll();
  }
}



//////////////////// NOTIFICATIONS ////////////////////
function updateNotifs(data) {
  var unread_notifs = 0
  var result = "";
  for (var i in data["alerts"]) {
    if (data["alerts"][i]["read_date"] === 0 && data["alerts"][i]["view_date"] === 0) {
      var style = "color:gold!important;";
      var extra = " - Nouveau !";
      unread_notifs += 1
    } else {
      var style = "";
      var extra = "";
    }
    result += "<a style='" + style + "' href='" + data["alerts"][i]["alert_url"] + "' target='_blank'>" + data["alerts"][i]["alert_text"] + "</a><br><small class='text-muted'>" + format_time(data["alerts"][i]["event_date"]) + extra + "</small><hr>";
  }
  document.getElementById('notifications').innerHTML = result;
  if (unread_notifs > 0) {
    document.getElementById('unread_notifs').innerHTML = unread_notifs;
  }
}



//////////////////// MESSAGES PRIVÉS ////////////////////
function updateMessages(data) {
  var unread_messages = 0
  var result = "";
  for (var i in data["conversations"]) {
    if (data["conversations"][i]["conversation_open"] == false) {
      var style = "color:gold!important;";
      var extra = " - Nouveau !";
      unread_notifs += 1
    } else {
      var style = "";
      var extra = "";
    }

    result += "<a style='" + style + "' href='" + data["conversations"][i]["view_url"] + "' target='_blank'>" + data["conversations"][i]["title"] + "</a><br>Dernier message : " + data["conversations"][i]["username"] + "</a><br><small class='text-muted'>" + format_time(data["conversations"][i]["start_date"]) + extra + "</small><hr>";
  }
  document.getElementById('messagerie').innerHTML = result;
  if (unread_notifs > 0) {
    document.getElementById('unread_messages').innerHTML = unread_messages;
  }
}