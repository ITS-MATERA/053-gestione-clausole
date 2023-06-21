sap.ui.define([], function () {
  "use strict";

  return {
    /**
     * Rounds the number unit value to 2 digits
     * @public
     * @param {string} sValue the number string to be rounded
     * @returns {string} sValue with 2 digits rounded
     */
    numberUnit: function (sValue) {
      if (!sValue) {
        return "";
      }
      return parseFloat(sValue).toFixed(2);
    },

    formatStatusProvision: function (sValue) {
      var self = this,
        bundle = self.getResourceBundle();
      var sDesc = "";
      if (sValue) {
        switch (sValue) {
          case "00":
          case "0":
            sDesc = bundle.getText("status00");
            break;
          case "01":
          case "1":
            sDesc = bundle.getText("status01");
            break;
          case "02":
          case "2":
            sDesc = bundle.getText("status02");
            break;
          case "t":
            sDesc = bundle.getText("statusAll");
            break;
          default:
            sDesc = bundle.getText("noStatus");
        }
      }

      return sDesc;
    },
    formatMotivation: function (sValue) {
      var self = this,
        bundle = self.getResourceBundle();
      var sDesc = "";
      if (sValue) {
        switch (sValue) {
          case "1":
            sDesc = bundle.getText("motivation1");
            break;
          case "2":
            sDesc = bundle.getText("motivation2");
            break;
          case "3":
            sDesc = bundle.getText("motivation3");
            break;
          case "4":
            sDesc = bundle.getText("motivation4");
            break;
          default:
            sDesc = bundle.getText("noStatus");
        }
      }

      return sDesc;
    },

    defaultFormatDate: function (sDate) {
      if (!sDate || sDate === "" || sDate === null) return "";

      // var oDate = new Date(sDate).toUTCString().format("yyyy-MM-DD");

      return sap.ui.core.format.DateFormat.getDateInstance({
        pattern: "yyyy-MM-dd",
      }).format(new Date());
    },
  };
});
