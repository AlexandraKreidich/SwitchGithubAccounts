class App {
  constructor() {
    this.domainName = "github.com";
    this.appData = this.getDataFromLocalStorage();
    this.appSettingsDiv = document.getElementById("accounts");
    this.addNewAccountBtn = document.getElementById("add-new-account-btn");
    this.addNewAccountInput = document.getElementById("new-account-input");
    this.resetAccountsBtn = document.getElementById("reset-accounts-btn");
    this.resetCookiesBtn = document.getElementById("reset-store-btn");

    this.addEventListeners();
    this.showAppData();
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
    this.appSettingsDiv.addEventListener("click", e => {
      this.swithAccount(e);
    });
    this.resetAccountsBtn.addEventListener("click", () => {
      this.resetAccounts();
    });
    this.addNewAccountBtn.addEventListener("click", () => {
      this.addNewAccount();
    });

    this.showAppData();
  }

  getCookiesFromCookieStore() {
    console.log("getCookiesFromCookieStore");

    let t = this;
    return new Promise(function(resolve) {
      chrome.cookies.getAll({ domain: t.domainName }, cookiesArr => {
        console.log(cookiesArr);
        resolve(cookiesArr);
      });
    });
  }

  getJSONCookies() {
    console.log("getJSONCookies");
    this.getCookiesFromCookieStore().then(resp => {
      console.log(JSON.stringify(resp));
    });
    return this.getCookiesFromCookieStore().then(JSON.stringify);
  }

  addNewAccount() {
    let t = this;

    let accountName = t.addNewAccountInput.value;
    t.addNewAccountInput.value = "";

    if (accountName !== null) {
      console.log("addNewAcc");

      t.getJSONCookies().then(cookiesResponse => {
        console.log(cookiesResponse);

        let newAccount = "kdv";

        newAccount = {
          name: accountName,
          cookies: cookiesResponse,
          isActive: false
        };

        console.log(newAccount);

        t.saveNewAppData(newAccount);
      });
    }
  }

  saveNewAppData(newAccount) {
    console.log(newAccount);
    this.appData.push(newAccount);
    localStorage.removeItem(this.domainName);
    localStorage.setItem(this.domainName, JSON.stringify(this.appSettings));
    console.log("savenewappsettings: ", this.appData);
    this.showAppData();
  }

  showAppData() {
    let t = this;

    if (t.appData.length === 0) {
      t.appSettingsDiv.innerHTML =
        '<div class="card"><div class="card-body">No saved accounts</div></div>';
    } else {
      let str = '<ul class="list-group">';
      for (var i in t.appData) {
        if (t.appData[i].isActive) {
          str +=
            '<li class="list-group-item active" id=' +
            i +
            ">" +
            t.appData[i].name +
            '<button type="button" class="btn btn-light btn-sm checkout-acc-btn" disabled>Checkout</button></li>';
        } else {
          str +=
            '<li class="list-group-item" id=' +
            i +
            ">" +
            t.appData[i].name +
            '<button type="button" class="btn btn-success btn-sm checkout-acc-btn">Checkout</button></li>';
        }
      }
      str += "</ul>";

      t.appSettingsDiv.innerHTML = str;
    }
  }
}

window.onload = function() {
  let accountSwitcher = new App();
};
