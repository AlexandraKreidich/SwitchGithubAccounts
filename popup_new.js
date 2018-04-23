var App = {
  domainName: "github.com",
  appSettings: [],
  appSettingsDiv: null,
  addNewAccountBtn: null,
  addNewAccountInput: null,
  resetAccountsBtn: null,
  resetCookiesBtn: null,

  init: function() {
    this.appSettingsDiv = document.getElementById("accounts");
    this.addNewAccountBtn = document.getElementById("add-new-account-btn");
    this.addNewAccountInput = document.getElementById("new-account-input");
    this.resetAccountsBtn = document.getElementById("reset-accounts-btn");
    this.resetCookiesBtn = document.getElementById("reset-store-btn");
    this.resetCookiesBtn.addEventListener("click", () => {
      this.deleteCookiesFromCookieStore();
    });
    this.appSettingsDiv.addEventListener("click", e => {
      this.swithAccount(e);
    });
    this.resetAccountsBtn.addEventListener("click", () => {
      this.resetAccounts();
    });
    this.addNewAccountBtn.addEventListener("click", () => {
      this.addNewAccount();
    });
    let settings = JSON.parse(localStorage.getItem(this.domainName));
    if (settings !== null) {
      this.appSettings = settings;
    }
    this.showAppSettingsHtml();
  },

  saveNewAppSettings: function() {
    localStorage.removeItem(this.domainName);
    localStorage.setItem(this.domainName, JSON.stringify(this.appSettings));
    this.showAppSettingsHtml();
  },

  showAppSettingsHtml: function() {
    let t = this;

    if (t.appSettings.length === 0) {
      t.appSettingsDiv.innerHTML =
        '<div class="card"><div class="card-body">No saved accounts</div></div>';
    } else {
      let str = '<ul class="list-group">';
      for (var i in t.appSettings) {
        if (this.appSettings[i].isActive) {
          str +=
            '<li class="list-group-item active" id=' +
            i +
            ">" +
            t.appSettings[i].name +
            "</li>";
        } else {
          str +=
            '<li class="list-group-item" id=' +
            i +
            ">" +
            t.appSettings[i].name +
            "</li>";
        }
      }
      str += "</ul>";
      t.appSettingsDiv.innerHTML = str;
    }
  },

  saveCookiesToLocalStorage(name) {
    chrome.cookies.getAll({ domain: this.domainName }, cookiesArr => {
      cookiesJSON = JSON.stringify(cookiesArr);
      localStorage.setItem(name, cookiesJSON);
    });
  },

  setCookiesFromLocalStorage(name) {
    let cookiesArr = JSON.parse(localStorage.getItem(name));
    let urlStr = "https://" + this.domainName;

    let cookiesToSet = [];

    cookiesToSet = cookiesArr.filter(function(cookie) {
      if (cookie.hostOnly !== undefined) {
        delete cookie.hostOnly;
      }
      if (cookie.session !== undefined) {
        delete cookie.session;
      }

      return true;
    });

    for (var i in cookiesToSet) {
      cookiesToSet[i].url = urlStr;

      chrome.cookies.set(cookiesToSet[i], cookie => {
        console.log(cookie);
      });
    }
  },

  deleteCookiesFromCookieStore: function() {
    chrome.cookies.getAll({ domain: this.domainName }, cookiesArr => {
      for (var i in cookiesArr) {
        chrome.cookies.remove({
          url: "https://" + cookiesArr[i].domain + cookiesArr[i].path,
          name: cookiesArr[i].name
        });
      }
    });
  },

  addNewAccount: function() {
    let accountName = this.addNewAccountInput.value;
    if (name !== null) {
      let newAccount = {
        name: accountName,
        isActive: this.appSettings.length === 0 ? true : false
      };

      this.saveCookiesToLocalStorage(newAccount.name);
      this.appSettings.push(newAccount);
      this.saveNewAppSettings();
    }
  },

  resetAccounts: function() {
    this.appSettings = [];
    this.saveNewAppSettings();
  },

  swithAccount: function(e) {
    let accountName = this.appSettings[e.target.id].name;
    this.appSettings.forEach(element => {
      if (element.isActive) {
        element.isActive = false;
      }
    });
    this.appSettings[e.target.id].isActive = true;
    this.deleteCookiesFromCookieStore();
    this.setCookiesFromLocalStorage(accountName);
    this.reloadPage();
  },

  reloadPage: function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(
      arrayOfTabs
    ) {
      var code = "window.location.reload();";
      chrome.tabs.executeScript(arrayOfTabs[0].id, { code: code });
    });
  }
};

window.onload = function() {
  App.init();
  App.deleteCookiesFromCookieStore();
};
