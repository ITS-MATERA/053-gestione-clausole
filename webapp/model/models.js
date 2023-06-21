sap.ui.define(
  ["sap/ui/model/json/JSONModel", "sap/ui/Device"],
  /**
   * provide app-view type models (as in the first "V" in MVVC)
   *
   * @param {typeof sap.ui.model.json.JSONModel} JSONModel
   * @param {typeof sap.ui.Device} Device
   *
   * @returns {Function} createDeviceModel() for providing runtime info for the device the UI5 app is running on
   */
  function (JSONModel, Device) {
    "use strict";

    return {
      createDeviceModel: function () {
        var oModel = new JSONModel(Device);
        oModel.setDefaultBindingMode("OneWay");
        return oModel;
      },

      createUserModel: async function () {
        var oUserModel = new sap.ui.model.json.JSONModel();
        var d = await this._getUserModel();
        oUserModel.setProperty("/" + "currentUser", d.data);
        return oUserModel;
      },

      _getUserModel: function () {
        return new Promise(function (resolve, reject) {
          $.ajax({
            url: "/sap/opu/odata/sap/ESH_SEARCH_SRV" + "/Users('<current>')",
            type: "GET",
            contentType: "application/json",
            dataType: "json",
            success: function (result) {
              resolve({ data: result.d.Id });
            },
            error: function (request, status, errorThrown) {},
          });
        });
      },
    };
  }
);
