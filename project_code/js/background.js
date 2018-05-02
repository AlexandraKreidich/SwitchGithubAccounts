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