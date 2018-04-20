var App = {
  COOKIES: null,
  DOMAIN: "github.com",
  cookiesJSON: null,
  showBtn: null,
  deleteBtn: null,
  saveBtn: null,
  copyBtn: null,
  resultDiv: null,

  init: function() {
    if (!chrome.cookies) {
      chrome.cookies = chrome.experimental.cookies;
    }
    this.COOKIES = chrome.cookies;
    this.resultDiv = document.getElementById("result");
    this.showBtn = document.getElementById("show");
    this.deleteBtn = document.getElementById("delete");
    this.saveBtn = document.getElementById("save");
    this.copyBtn = document.getElementById("copyFromLS");
    this.showBtn = this.showBtn.addEventListener("click", e => {
      e.preventDefault();
      this.getCookiesListHtml();
    });
    this.deleteBtn.addEventListener("click", e => {
      e.preventDefault();
      this.deleteCookiesFromCookieStore();
    });
    this.saveBtn.addEventListener("click", e => {
      e.preventDefault();
      this.saveCookiesToLocalStorage();
    });
    this.copyBtn.addEventListener("click", e => {
      e.preventDefault();
      this.copyCookiesFromLocalStorage();
    });
  },

  getCookiesListHtml: function() {
    let t = this;

    t.resultDiv.innerHTML = "";

    let innerHtmlListCookies = '<ul class="list-group">';

    t.COOKIES.getAll({ domain: this.DOMAIN }, cookiesArr => {
      for (var i in cookiesArr) {
        innerHtmlListCookies +=
          '<li class="list-group-item">' +
          "NAME: " +
          cookiesArr[i].name +
          " VALUE: " +
          cookiesArr[i].value +
          " DOMAIN: " +
          cookiesArr[i].domain +
          "</li>";
      }

      t.resultDiv.innerHTML = innerHtmlListCookies;
    });
  },

  saveCookiesToLocalStorage: function() {
    var t = this;
    t.resultDiv.innerHTML = "saving";
    let cookiesJSON;
    t.COOKIES.getAll({ domain: t.DOMAIN }, cookiesArr => {
      cookiesJSON = JSON.stringify(cookiesArr);
      localStorage.setItem(t.DOMAIN, cookiesJSON);
      // let Arr = JSON.parse(localStorage.getItem(t.DOMAIN));
      // t.resultDiv.innerHTML = JSON.stringify(Arr);
    });
  },

  deleteCookiesFromCookieStore: function() {
    var t = this;
    t.COOKIES.getAll({ domain: this.DOMAIN }, cookiesArr => {
      for (var i in cookiesArr) {
        t.COOKIES.remove({
          url: "https://" + cookiesArr[i].domain + cookiesArr[i].path,
          name: cookiesArr[i].name
        });
      }
    });
  },

  copyCookiesFromLocalStorage: function() {
    var t = this;

    let cookiesArr = JSON.parse(localStorage.getItem(t.DOMAIN));

    for (var i in cookiesArr) {
      t.COOKIES.set(cookiesArr[i], function(cookie) {
        alert(JSON.stringify(cookie));
        alert(chrome.extension.lastError);
        alert(chrome.runtime.lastError);
      });
    }

    t.resultDiv.innerHTML = JSON.stringify(cookiesArr);
  }
};

window.onload = function() {
  App.init();
};
