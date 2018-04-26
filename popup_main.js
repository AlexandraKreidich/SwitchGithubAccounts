class App {
  constructor() {
    this.domainName = "github.com";
    this.appData = this.getDataFromLocalStorage();
    this.appDataDiv = document.getElementById("accounts");
    this.addNewAccountBtn = document.getElementById("add-new-account-btn");
    this.addNewAccountInput = document.getElementById("new-account-input");
    this.resetAccountsBtn = document.getElementById("reset-accounts-btn");
    this.resetCookiesBtn = document.getElementById("reset-store-btn");
    chrome.cookies.onChanged.addListener(changeInfo => {
      //console.log(changeInfo);
    });
    this.addEventListeners();
  }

  getDataFromLocalStorage() {
    let data = JSON.parse(localStorage.getItem(this.domainName));

    console.log(data);

    if (data === null) {
      data = [];
    }

    return data;
  }

  addEventListeners() {
    this.resetCookiesBtn.addEventListener("click", () => {
      this.deleteCookiesFromCookieStore();
    });
    this.resetAccountsBtn.addEventListener("click", () => {
      this.resetAccounts();
    });
    this.addNewAccountBtn.addEventListener("click", () => {
      this.addNewAccount();
    });
    this.appDataDiv.addEventListener("click", e => {
      this.swithAccount(e);
    });
    this.showAppData();
  }

  getCookiesFromCookieStore() {
    console.log("getCookiesFromCookieStore");

    let t = this;
    return new Promise(function(resolve) {
      chrome.cookies.getAll({ domain: t.domainName }, cookiesArr => {
        resolve(cookiesArr);
      });
    });
  }

  removeCookie(cookie) {
    console.log("removeCookie");
    return new Promise(function(resolve) {
      chrome.cookies.remove(
        {
          url: "https://" + cookie.domain + cookie.path,
          name: cookie.name
        },
        cookie => {
          //console.log(cookie);
          resolve(cookie);
        }
      );
    });
  }

  deleteCookiesFromCookieStore(cookiesArr) {
    let t = this;

    return new Promise(function(resolve) {
      t.getCookiesFromCookieStore().then(cookiesArr => {
        Promise.all(cookiesArr.map(t.removeCookie)).then(results => {
          resolve(results);
        });
      });
    });
  }

  setCookie(cookie) {
    console.log("setCookie");
    return new Promise(function(resolve) {
      chrome.cookies.set(cookie, setedCookie => {
        //console.log("setedCookie: ", setedCookie);
        resolve(setedCookie);
      });
    });
  }

  setCookiesToCookieStore(cookiesArr) {
    let t = this;

    return new Promise(function(resolve) {
      Promise.all(cookiesArr.map(t.setCookie)).then(results => {
        resolve(results);
      });
    });
  }

  getJSONCookies() {
    return this.getCookiesFromCookieStore().then(JSON.stringify);
  }

  addNewAccount() {
    let t = this;

    let accountName = t.addNewAccountInput.value;
    t.addNewAccountInput.value = "";

    if (accountName !== null) {
      t.getJSONCookies().then(cookiesResponse => {
        let newAccount = {
          name: accountName,
          cookies: cookiesResponse,
          isActive: false
        };
        t.saveNewAppData(newAccount);
      });
    }
  }

  saveNewAppData(newAccount) {
    if (newAccount !== undefined) {
      this.appData.push(newAccount);
    }

    localStorage.setItem(this.domainName, JSON.stringify(this.appData));

    console.log("savenewappsettings: ", this.appData);

    this.showAppData();
  }

  showAppData() {
    let t = this;

    if (t.appData.length === 0) {
      t.appDataDiv.innerHTML =
        '<div class="card"><div class="card-body">No saved accounts</div></div>';
    } else {
      let str = '<ul class="list-group"">';
      for (var i in t.appData) {
        if (t.appData[i].isActive) {
          str +=
            '<li class="list-group-item active">' +
            t.appData[i].name +
            '<button type="button" class="btn btn-light btn-sm checkout-acc-btn" name="switch-account-btn" disabled value=' +
            i +
            '>Switch</button><button type="button" class="btn btn-light btn-sm" name="sign-in-btn" value=' +
            i +
            ">Sign In</button>" +
            '<button type="button" class="btn btn-light btn-sm" name="sign-out-btn">Sign Out</button></li>';
        } else {
          str +=
            '<li class="list-group-item" id=' +
            i +
            ">" +
            t.appData[i].name +
            '<button type="button" class="btn btn-success btn-sm checkout-acc-btn" name="switch-account-btn" value=' +
            i +
            '>Switch</button><button type="button" class="btn btn-light btn-sm" name="sign-in-btn"value=' +
            i +
            ">Sign In</button>" +
            '<button type="button" class="btn btn-light btn-sm" name="sign-out-btn">Sign Out</button></li>';
        }
      }
      str += "</ul>";

      t.appDataDiv.innerHTML = str;
    }
  }

  resetAccounts() {
    this.appData = [];
    this.saveNewAppData();
  }

  swithAccount(e) {
    let t = this;
    if (e.target.name === "switch-account-btn") {
      let cookiesArr = JSON.parse(t.appData[e.target.value].cookies);
      let urlStr = "https://" + this.domainName;
      let cookiesToSet = [];

      cookiesToSet = cookiesArr.filter(function(cookie) {
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

        if (cookie.name === "_gh_sess") {
          return false;
        }

        return true;
      });

      console.log("cookiesToSet: ", cookiesToSet);

      t.deleteCookiesFromCookieStore().then(results => {
        t.setCookiesToCookieStore(cookiesToSet).then(results => {
          t.reloadPage().then(console.log);
        });
      });
    } else if (e.target.name === "sign-in-btn") {
      let cookiesArr = JSON.parse(t.appData[e.target.value].cookies);
      let urlStr = "https://" + this.domainName;
      let cookiesToSet = [];

      cookiesToSet = cookiesArr.filter(function(cookie) {
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
        return true;
      });
      t.setCookiesToCookieStore(cookiesToSet).then(() => {
        t.reloadPage();
      });
    } else if (e.target.name === "sign-out-btn") {
      t.deleteCookiesFromCookieStore().then(() => {
        t.reloadPage();
      });
    }
  }

  reloadPage() {
    return new Promise(function(resolve) {
      chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.update(tab.id, { url: "https://github.com/login" });
        // chrome.tabs.reload(tab.id, null, () => {
        //   window.onload = resolve("finished");
        // });
      });
    });
  }
}

window.onload = function() {
  let accountSwitcher = new App();
};
