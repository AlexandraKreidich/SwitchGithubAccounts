class BgApp {

  constructor() {
    this.domainName = "github.com";
    this.isConnected = false;
    this.cookieNames = ["__Host-user_session_same_site", "user_session", "dotcom_user"];
    this.appData = this.getDataFromLocalStorage();
    this.connect();
    this.addListeners();
  }

  addListeners() {
    let t = this;

    chrome
      .tabs
      .onUpdated
      .addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === "complete" && (tab.url).indexOf(t.domainName) > -1 && !t.isConnected) {
          t.onPageRefreshListener();
        }
      });

    chrome
      .cookies
      .onChanged
      .addListener((changeInfo) => {
        if (changeInfo.cookie.name === "user_session" && changeInfo.cause === "explicit" && !changeInfo.removed) {
          t.refreshUserSession(parseFloat(changeInfo.cookie.expirationDate));
        }
      });
  }

  refreshUserSession(newValue) {
    let t = this;

    t.appData = t.getDataFromLocalStorage();

    t
      .appData
      .forEach(account => {
        if (account.isActive) {
          account
            .cookies
            .forEach(cookie => {
              if (cookie.name === "user_session") {
                cookie.expirationDate = newValue;
                t.saveNewAppData();
              }
            })
        }
      })
  }

  getDataFromLocalStorage() {
    let data = JSON.parse(localStorage.getItem(this.domainName));

    if (data === null) {
      data = [];
    }

    return data;
  }

  saveNewAppData() {
    localStorage.setItem(this.domainName, JSON.stringify(this.appData));
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
        port
          .onDisconnect
          .addListener(function () {
            t.isConnected = false;
            t.appData = t.getDataFromLocalStorage();
          });
        t.saveNewAppData();
        t.isConnected = true;
      });
  }

  checkIfUserCanAssignAccount() {
    let t = this;

    t
      .getAccountNameFromCookie()
      .then(userName => {
        t
          .appData
          .forEach(elem => {
            if (elem.shouldAssign) {
              elem
                .cookies
                .forEach(cookie => {
                  if (cookie.name === "dotcom_user") {
                    if (cookie.value === userName) {
                      elem.isActive = true;
                      t.saveNewAppData();
                    }
                  }
                });
            }
          })
      });
  }

  checkIfUserLoggedInExistingAccount() {
    let t = this;

    t
      .getAccountNameFromCookie()
      .then(userName => {
        t
          .appData
          .forEach(elem => {
            elem
              .cookies
              .forEach(cookie => {
                if (cookie.name === "dotcom_user") {
                  if (cookie.value === userName) {
                    elem.isActive = true;
                    t.saveNewAppData();
                  }
                }
              });
          })
      });

  }

  getAccountNameFromCookie() {
    let t = this;

    return new Promise(function (resolve) {
      t
        .getCookiesFromCookieStore()
        .then(results => {
          results.forEach(cookie => {
            if (cookie.name === "dotcom_user") {
              resolve(cookie.value);
            }
          })
        })
    });
  }

  onPageRefreshListener() {
    let t = this;

    t
      .isUserLoggedOutFromGithub()
      .then(result => {
        if (result) {
          t
            .appData
            .forEach(elem => {
              if (elem.isActive) {
                elem.shouldAssign = true;
                elem.isActive = false;
                t.saveNewAppData();
              }
            })
        }
      });

    t
      .checkIfLoggedInOnGithub()
      .then(result => {
        let isLoggedInOnExtensionFlag = t.checkIfLoggedInOnExtension();
        if (result && !isLoggedInOnExtensionFlag) {
          t.checkIfUserLoggedInExistingAccount();
        } else if (result) {
          t.checkIfUserCanAssignAccount();
        }
      })
  }

  isUserLoggedOutFromGithub() {
    let t = this;

    return new Promise(function (resolve) {
      t
        .checkIfLoggedInOnGithub()
        .then(result => {
          if (t.checkIfLoggedInOnExtension() === true && result === false) {
            resolve(true);
          } else {
            resolve(false);
          }
        })
    });
  }

  checkIfLoggedInOnGithub() {
    let t = this;

    return new Promise(function (resolve) {
      t
        .getCookie("logged_in")
        .then(cookie => {
          if (cookie.value === "no") {
            resolve(false);
          }
          resolve(true);
        }, error => {
          resolve(false);
        })
    });
  }

  checkIfLoggedInOnExtension() {
    let flag = false;

    this
      .appData
      .forEach(elem => {
        if (elem.isActive) {
          flag = true;
        }
      });

    return flag;
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
  let App = new BgApp();
}