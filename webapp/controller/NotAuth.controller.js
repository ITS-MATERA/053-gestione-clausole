sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel"],
  function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend(
      "gestioneattivazioneclausole.controller.NotAuth",
      {
        onInit: function () {
          this.getRouter()
            .getRoute("notAuth")
            .attachPatternMatched(this._onObjectMatched, this);
        },
        _onObjectMatched: function (oEvent) {
          var self = this,
            parameter = oEvent.getParameter("arguments"),
            sMex = parameter.mex;
          var oViewModel = new JSONModel({ mex: sMex });
          self.getView().setModel(oViewModel, "view");
        },
      }
    );
  }
);
