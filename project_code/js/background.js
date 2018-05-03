class BgApp {
  constructor() {
    this.connect();
    this.isConnected = false;
  }

  getCookie(name) {
    return new Promise(function (resolve) {
      chrome
        .cookies
        .get({
          url: "https://github.com/",
          name: name
        }, cookie => {
          resolve(cookie);
        })
    })
  }

  getCookiesFromCookieStore() {
    let t = this;

    return new Promise(function (resolve) {
      Promise
        .all(t.cookieNames.map(t.getCookie))
        .then(results => {
          resolve(results);
        }, error => {
          console.error("getCookiesFromCookieStore ERROR: ", error)
        })
    });
  }

  connect() {
    let t = this;

    chrome
      .extension
      .onConnect
      .addListener(function (port) {
        console.log("popup opened!");
        this.isConnected = true;
        port
          .onMessage
          .addListener(function (msg) {
            console.log(msg);
          });
        port
          .onDisconnect
          .addListener(function () {
            console.log("popup closed!");
            this.isConnected = false;
          })
      });
  }
}

var rules = {
  conditions: [
    new chrome
      .declarativeContent
      .PageStateMatcher({
        pageUrl: {
          hostEquals: "github.com",
          schemes: ["https"]
        }
      })
  ],
  actions: [
    new chrome
      .declarativeContent
      .ShowPageAction()
  ]
};

chrome
  .runtime
  .onInstalled
  .addListener(function (details) {
    chrome
      .declarativeContent
      .onPageChanged
      .removeRules(undefined, function () {
        chrome
          .declarativeContent
          .onPageChanged
          .addRules([rules]);
      });
  });

window.onload = function () {
  console.log("onLoad");
  let App = new BgApp();
}