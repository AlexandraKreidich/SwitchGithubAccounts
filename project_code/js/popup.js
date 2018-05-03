class App {
  constructor() {
    this.domainName = "github.com";
    this.url = "https://github.com/";
    this.appData = this.getDataFromLocalStorage();
    this.appDataDiv = document.getElementById("accounts");
    this.addNewAccountBtn = document.getElementById("add-new-account-btn");
    this.addNewAccountInput = document.getElementById("new-account-input");
    this.errorMsgDiv = document.getElementById("error-msg");
    this.cookieNames = ["__Host-user_session_same_site", "user_session", "dotcom_user"];
    this.port = chrome
      .extension
      .connect({name: "Background and popup scripts connection"});
    this.addEventListeners();
  }

  refreshUserSession(newValue) {

    let t = this;

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

  addEventListeners() {
    let t = this;

    t
      .addNewAccountBtn
      .addEventListener("click", () => {
        t.addNewAccount();
      });
    t
      .appDataDiv
      .addEventListener("click", e => {
        t.onAccountBtnClick(e);
      });
    t
      .errorMsgDiv
      .addEventListener("click", e => {
        t.onErrorMsgDiv(e);
      });
    chrome
      .cookies
      .onChanged
      .addListener((changeInfo) => {
        if (changeInfo.cookie.name === "user_session" && changeInfo.cause === "explicit") {
          t.refreshUserSession(parseFloat(changeInfo.cookie.expirationDate));
        }
      });

    chrome
      .tabs
      .onUpdated
      .addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status === "complete") {
          t.onPageRefreshListener();
        }
      });

    t
      .port
      .onMessage
      .addListener(function (msg) {
        console.log("message from BgApp: ", msg);
      });

    t.showAppData();
  }

  insertScript() {
    var s = document.createElement('script');
    s.src = chrome
      .extension
      .getURL('js/script.js');
    (document.head || document.documentElement).appendChild(s);
  }

  onPageRefreshListener() {
    let t = this;

    t
      .isUserLoggedOutFromGithub()
      .then(result => {
        console.log("isUserLoggedOutFromGithub: ", result);
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
        if (result) {
          t.checkIfUserCanAssignAccount();
        }
      })
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

    //console.log("checkIfLoggedInOnExtension: ", flag);
    return flag;
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

  onErrorMsgDiv(e) {
    if (e.target.id === "closeErrorAlert") {
      this.errorMsgDiv.innerHTML = "";
    }
  }

  getErrorMessageHTML(text) {
    return '<div class="alert alert-danger error-alert"><button type="button" class="close" ' +
      'id="closeErrorAlert">&times;</button><strong>Ooops!</strong> ' + text + '</div>';
  }

  removeCookie(cookie) {
    return new Promise(function (resolve) {
      chrome
        .cookies
        .remove({
          url: "https://github.com",
          name: cookie.name
        }, cookie => {
          resolve(cookie);
        });
    });
  }

  deleteCookiesFromCookieStore(cookiesArr) {
    let t = this;

    return new Promise(function (resolve) {
      t
        .getCookiesFromCookieStore()
        .then(cookiesArr => {
          Promise
            .all(cookiesArr.map(t.removeCookie))
            .then(results => {
              resolve(results);
            }, error => {
              console.error("deleteCookiesFromCookieStore ERROR: ", error);
            });
        });
    });
  }

  setCookie(cookie) {
    return new Promise(function (resolve) {
      chrome
        .cookies
        .set(cookie, setedCookie => {
          resolve(setedCookie);
        });
    });
  }

  setCookiesToCookieStore(cookiesArr) {
    let t = this;

    return new Promise(function (resolve) {
      Promise
        .all(cookiesArr.map(t.setCookie))
        .then(results => {
          resolve(results);
        });
    });
  }

  getJSONCookies() {
    return this
      .getCookiesFromCookieStore()
      .then(JSON.stringify);
  }

  checkIfTheNameUnique(accountName) {
    let flag = true;
    let t = this;

    t
      .appData
      .forEach(element => {
        if (element.name === accountName) {
          flag = false;
          t.errorMsgDiv.innerHTML = t.getErrorMessageHTML('The name is not unique.');
        }
      });
    return flag;
  }

  checkIfCookiesUnique(cookiesArr) {

    let t = this;
    let userName = '';
    let result = true;

    cookiesArr.forEach(cookie => {
      if (cookie.name === 'dotcom_user') {
        userName = cookie.value;
      }
    });
    t
      .appData
      .forEach(account => {
        account
          .cookies
          .forEach(cookie => {
            if (cookie.name === 'dotcom_user') {
              if (cookie.value === userName) {
                result = false;
                t.errorMsgDiv.innerHTML = t.getErrorMessageHTML('This account already exests.');
              }
            }
          })
      })
    return result;
  }

  selectCookiesToSave(cookiesArr) {

    let t = this;
    let urlStr = t.url;
    let cookiesToSet = [];

    cookiesToSet = cookiesArr.filter(function (cookie) {
      cookie.url = urlStr;

      if (cookie.hostOnly !== undefined) {
        delete cookie.hostOnly;
      }
      if (cookie.session !== undefined) {
        delete cookie.session;
      }
      if (cookie.user_session !== undefined) {
        delete cookie.user_session;
      }
      if (cookie.domain !== undefined && (cookie.name === "user_session" || cookie.name === "__Host-user_session_same_site" || cookie.name === "_gh_sess" || cookie.name === "tz")) {
        delete cookie.domain;
      }

      return true;
    });

    return cookiesToSet;

  }

  addNewAccount() {
    let t = this;
    t.errorMsgDiv.innerHTML = "";

    let accountName = t.addNewAccountInput.value;
    t.addNewAccountInput.value = "";

    if (accountName !== "" && t.checkIfTheNameUnique(accountName)) {

      t
        .getCookiesFromCookieStore()
        .then(cookiesResponse => {
          if (t.checkIfCookiesUnique(cookiesResponse)) {
            let newAccount = {
              name: accountName,
              cookies: t.selectCookiesToSave(cookiesResponse),
              shouldAssign: false,
              isActive: true
            };
            t.saveNewAppData(newAccount);
          }
        });
    }
  }

  saveNewAppData(newAccount) {

    if (newAccount !== undefined) {
      this
        .appData
        .push(newAccount);
    }

    localStorage.setItem(this.domainName, JSON.stringify(this.appData));

    this.showAppData();
  }

  showAppData() {
    let t = this;

    if (t.appData.length === 0) {
      t.appDataDiv.innerHTML = '<div class="card empty-accounts"><div class="card-body">No saved accounts</div><' +
          '/div>';
    } else {
      let str = '<ul class="list-group"">';
      for (var i in t.appData) {
        let elem = t.appData[i];
        if (elem.isActive && !elem.shouldAssign) {
          str += '<li class="list-group-item active-item"><div class="row"><div class="col"><h6>' + elem.name + '</h6></div><div class="col"><button type="button" class="btn btn-light btn-sm ch' +
              'eckout-acc-btn" name="sign-out-account-btn" value=' + i + '>Sign out</button><button type="button" class="btn close" name="delete-account-b' +
              'tn" value=' + i + ">&times;</button></div></div></li>";
        } else if (!elem.isActive && !elem.shouldAssign) {
          str += '<li class="list-group-item"><div class="row"><div class="col"><h6>' + elem.name + '</h6></div><div class="col"><button type="button" class="btn btn-light btn-sm ch' +
              'eckout-acc-btn" name="sign-in-account-btn" value=' + i + '>Sign In</button><button type="button" class="btn close" name="delete-account-bt' +
              'n" value=' + i + ">&times;</button></div></div></li>";
        } else if (elem.isActive && elem.shouldAssign) {
          str += '<li class="list-group-item active-item"><div class="row"><div class="col"><h6>' + elem.name + '</h6></div><div class="col"><button type="button" class="btn btn-danger btn-sm" ' +
              'name="assign-account-btn" value=' + i + '>Assign</button><button type="button" class="btn close" name="delete-account-btn' +
              '" value=' + i + ">&times;</button></div></div></li>";
        } else if (!elem.isActive && elem.shouldAssign) {
          str += '<li class="list-group-item list-group-item-dark"><div class="row"><div class="co' +
              'l"><h6>' + elem.name + '</h6></div><div class="col"><button type="button" class="btn btn-danger btn-sm c' +
              'heckout-acc-btn" name="sign-out-account-btn" value=' + i + ' disabled>Logged out</button><button type="button" class="btn close" name="delet' +
              'e-account-btn" value=' + i + ">&times;</button></div></div></li>";
        }
      }
      str += "</ul>";

      t.appDataDiv.innerHTML = str;
    }
  }

  onAccountBtnClick(e) {
    let t = this;
    let btnName = e.target.name;
    switch (btnName) {
      case "sign-out-account-btn":
        t.signOut(e.target.value);
        break;
      case "sign-in-account-btn":
        t.signIn(e.target.value);
        break;
      case "delete-account-btn":
        t.deleteAccount(e.target.value);
        break;
      case "assign-account-btn":
        t.assignAccount(e.target.value);
        break;
      default:
        break;
    }
  }

  assignAccount(index) {
    let t = this;
    t
      .getCookiesFromCookieStore()
      .then(results => {
        t.appData[index].cookies = t.selectCookiesToSave(results);
        t.appData[index].shouldAssign = false;
        t.saveNewAppData();
      })
  }

  deleteAccount(index) {
    let t = this;

    if (t.appData[index].isActive && !t.appData[index].shouldAssign) {
      t
        .deleteCookiesFromCookieStore()
        .then(results => {
          t
            .appData
            .splice(index, 1);
          t.saveNewAppData();
          t.reloadPage();
        })
    } else {
      t
        .appData
        .splice(index, 1);
      t.saveNewAppData();
    }

  }

  signOut(index) {

    let t = this;

    t
      .deleteCookiesFromCookieStore()
      .then(() => {
        t.appData[index].isActive = false;
        t
          .reloadPage()
          .then(t.saveNewAppData());
      })
  }

  signIn(index) {

    let t = this;
    let isLoggedIn = false;
    t
      .appData
      .forEach(elem => {
        if (elem.isActive) {
          elem.isActive = false;
          isLoggedIn = true;
        }
      });

    t.appData[index].isActive = true;

    if (isLoggedIn) {
      t
        .deleteCookiesFromCookieStore()
        .then(results => {
          t
            .setCookiesToCookieStore(t.appData[index].cookies)
            .then(t.reloadPage().then(t.saveNewAppData()))
        })
    } else {
      t
        .setCookiesToCookieStore(t.appData[index].cookies)
        .then(t.reloadPage().then(t.saveNewAppData()))
    }
  }

  reloadPage() {
    return new Promise(function (resolve) {
      chrome
        .tabs
        .getSelected(null, function (tab) {
          chrome
            .tabs
            .update(tab.id, {url: "https://github.com"});
        });
    });
  }
}

window.onload = function () {
  let accountSwitcher = new App();
};
