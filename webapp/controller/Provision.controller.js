sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/library",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/library",
    "sap/m/Text",
    "sap/m/MessageBox",
  ],
  function (BaseController, JSONModel, History, formatter) {
    "use strict";

    const PAGINATOR_MODEL = "paginatorModel";
    const PROVISION_MODEL = "provisionView";
    const ENTITY_PROVISION_SET = "ProvisionSet";
    const ENTITY_BENEFICIARY_SET = "BeneficiarySet";
    const BENEFICIARY_MODEL = "Beneficiary";
    const ENTITY_PROVISION_ITEMS_SET = "ProvisionItemsSet";
    const ENTITY_PROVISION_PREVIEW_SET = "ProvisionPreviewSet";
    const PROVISION_SET_MODEL = "Provision";
    const PROVISION_SAVE_MODEL = "ProvisionSave";
    const PROVISION_ITEMS_MODEL = "ProvisionItems";
    const PROVISION_PREVIEW_MODEL = "ProvisionPreview";
    const VISIBILITY_MODEL = "ZSS4_CA_CONI_VISIBILITA_SRV";
    const VISIBILITY_ENTITY = "ZES_CONIAUTH_SET";
    const FILTER_SEM_OBJ = "ZS4_FUNZ_IMP_ATT_CLA_SRV";
    const FILTER_AUTH_OBJ = "Z_GEST_CLA";
    const ACTIVITY_CHECK_MODEL = "ActivityCheck";
    const USER_MODEL = "userParamsModel";
    const URL_CHANGE =
      "/sap/opu/odata/sap/ZS4_FUNZ_IMP_ATT_CLA_SRV/ChangeProvision";
    const URL_ASSIGN =
      "/sap/opu/odata/sap/ZS4_FUNZ_IMP_ATT_CLA_SRV/AssignProvision";
    const URL_ACTIVATE =
      "/sap/opu/odata/sap/ZS4_FUNZ_IMP_ATT_CLA_SRV/ActivateProvision";

    const URL_F_CHANGE = "ChangeProvision";
    const URL_F_ASSIGN = "AssignProvision";
    const URL_F_ACTIVATE = "ActivateProvision";

    const TABLE_CHANGE_ASSIGN = "tableChangeAssign";
    const TABLE_ASSIGN = "tableAssign";

    var sAgrName;
    var sFikrs;
    var sPrctr;

    return BaseController.extend(
      "gestioneattivazioneclausole.controller.Provision",
      {
        formatter: formatter,

        onInit: function () {
          var oViewModel = new JSONModel({
            busy: true,
            delay: 0,
            ZStatoCla: null,
            ZcodiKErrore: null,
            ZCodIpe: null,
            ZCodCla: null,
            FipexEng: null,
            FistlEng: null,
            ZgeberEng: null,
            ZidIpe: null,
            btnAction: null,
            buttonEnabled: null,
            isActive: null,
            titleTable: null,
            ProvisionItemsFilters: null,
            ProvisionSaveFilters: null,
            ProvisionPreviewFilters: null,
            ProvisionPreviewFiltersGeneric: null,
            ProvisionItemsTotal: 0,
            ProvisionSaveTotal: 0,
            ProvisionPreviewTotal: 0,
          });

          var oViewModelPaginator = new JSONModel({
            btnPrevEnabled: false,
            btnFirstEnabled: false,
            btnNextEnabled: false,
            btnLastEnabled: false,
            recordForPageEnabled: false,
            currentPageEnabled: true,
            stepInputDefault: 4,
            currentPage: 1,
            maxPage: 1,
            paginatorSkip: 0,
            paginatorClick: 0,
            ProvisionItemsMaxPage: 1,
            ProvisionPreviewMaxPage: 1,
            ProvisionSaveMaxPage: 1,
          });

          var oViewModelUserParams = new JSONModel({
            fik: null,
            buk: null,
            prc: null,
          });

          this.getRouter()
            .getRoute("provision")
            .attachPatternMatched(this._onObjectMatched, this);
          this.setModel(oViewModel, PROVISION_MODEL);
          this.setModel(oViewModelPaginator, PAGINATOR_MODEL);

          this.setModel(oViewModelUserParams, USER_MODEL);
        },

        _setVisibility: async function () {
          var self = this,
            oAuthModel = self.getModel(VISIBILITY_MODEL),
            oUserParamsModel = self.getModel(USER_MODEL),
            btnAction = self.getView().byId("idButtonActions"),
            aFilters = [];
          var oView = self.getView();
          oView.setBusy(true);

          aFilters.push(self.setFilterEQWithKey("SEM_OBJ", FILTER_SEM_OBJ));
          aFilters.push(self.setFilterEQWithKey("AUTH_OBJ", FILTER_AUTH_OBJ));

          self
            .getModel(VISIBILITY_MODEL)
            .metadataLoaded()
            .then(function () {
              oAuthModel.read("/" + VISIBILITY_ENTITY, {
                filters: aFilters,
                success: function (data) {
                  oView.setBusy(false);

                  var rec = data.results[0];

                  sAgrName = rec.AGR_NAME;
                  sFikrs = rec.FIKRS;
                  sPrctr = rec.PRCTR;

                  var aResults = data.results;
                  var bACTV_2 = self.isIncluded(aResults, "ACTV_2", "Z02");
                  var bACTV_4 = self.isIncluded(aResults, "ACTV_4", "Z04");
                  var bACTV_5 = self.isIncluded(aResults, "ACTV_5", "Z05");

                  var check = {
                    Change: bACTV_2,
                    Active: bACTV_4,
                    Assign: bACTV_5,
                  };

                  self._setButtonEnabled(check);
                  var oModel = new sap.ui.model.json.JSONModel();
                  oModel.setData(check);
                  self.setModel(oModel, ACTIVITY_CHECK_MODEL);
                },
                error: function (error) {
                  oView.setBusy(false);

                  self.getRouter().navTo("notAuth", {
                    mex: self.getResourceBundle().getText("notAuthText"),
                  });
                },
              });
            });
        },

        onAction: function (oEvent) {
          var self = this;
          var sMessage = null;
          var oView = self.getView();
          var oBundle = self.getResourceBundle();
          var provisionView = self.getModel(PROVISION_MODEL);
          var sZStatoCla = provisionView.getProperty("/ZStatoCla");
          var btnAction = provisionView.getProperty("/btnAction");

          if (sZStatoCla === "00" && btnAction !== oBundle.getText("btnActive"))
            self._onChangeProvision();
          else {
            if (sZStatoCla === "00")
              sMessage = oBundle.getText("msgDialogWarnChange");
            else if (sZStatoCla === "01")
              sMessage = oBundle.getText("msgDialogWarnActive");
            else if (sZStatoCla === "02") {
              sMessage = oBundle.getText("msgDialogWarnAssign");

              var oTable = oView.byId(TABLE_ASSIGN);

              if (!self._isRowSelected(oTable)) return false;
            }
            self._setDialogWarning(sMessage);
          }
        },
        _isRowSelected: function (oTable) {
          var self = this;
          if (oTable.getSelectedContextPaths().length === 0) {
            self._setMessage(
              "titleDialogWarning",
              "msgNoRowSelected",
              "warning"
            );
            return false;
          } else return true;
        },
        _setDialogWarning: function (sMessage) {
          var self = this;
          var oBundle = self.getResourceBundle();
          var oDialog = new sap.m.Dialog({
            title: oBundle.getText("titleDialogWarning"),
            state: "Warning",
            type: "Message",
            content: [
              new sap.m.Text({
                text: sMessage,
              }),
            ],
            beginButton: new sap.m.Button({
              text: oBundle.getText("btnOK"),
              type: "Emphasized",
              press: function () {
                oDialog.close();
                self._setBusyMessage();
                self._getActionResponse();
              },
            }),
            endButton: new sap.m.Button({
              text: oBundle.getText("btnCancel"),
              type: "Emphasized",
              press: function () {
                oDialog.close();
              },
            }),
            afterClose: function () {
              oDialog.destroy();
            },
          });

          oDialog.open();
        },

        _setBusyMessage: function () {
          var self = this;
          var oBundle = self.getResourceBundle();
          self.oDialogWarn = new sap.m.Dialog({
            title: oBundle.getText("titleDialogCallOperation"),
            state: "Warning",
            type: "Message",
            content: [
              new sap.m.Text({
                text: oBundle.getText("msgDialogCallOperation"),
              }),
            ],
            afterClose: function () {
              self.getView().setBusy(false);
              self.oDialogWarn.destroy();
            },
          });
          self.oDialogWarn.open();

          self.createBusyDialog();
        },

        _onChangeProvision: function () {
          var self = this;
          var oBundle = self.getResourceBundle();
          var oView = self.getView();
          var provisionView = self.getModel(PROVISION_MODEL);
          var sZStatoCla = provisionView.getProperty("/ZStatoCla");
          var provisionView = self.getModel(PROVISION_MODEL);
          var btnAction = self
            .getModel(PROVISION_MODEL)
            .getProperty("/btnAction");

          if (btnAction === oBundle.getText("btnChange")) {
            var panelRect = oView.byId("idPanelChangeActive");
            var panelRectSave = oView.byId("idPanelChangeAssign");
            var aFiltersSave = provisionView.getProperty(
              "/ProvisionSaveFilters"
            );
            // panelRect.setVisible(false);
            // panelRectSave.setVisible(true);
            // btnAction = provisionView.setProperty(
            //   "/btnAction",
            //   oBundle.getText("btnSave")
            // );

            self.resetEntityModel(PROVISION_SAVE_MODEL);

            self._readEntityRettifica(
              ENTITY_PROVISION_ITEMS_SET,
              PROVISION_SAVE_MODEL,
              aFiltersSave,
              "02",
              false,
              function (callback) {
                if (callback) {
                  panelRect.setVisible(false);
                  panelRectSave.setVisible(true);
                  btnAction = provisionView.setProperty(
                    "/btnAction",
                    oBundle.getText("btnSave")
                  );
                  // self.resetEntityModel(PROVISION_SAVE_MODEL);
                }
              }
            );
          } else if (btnAction === oBundle.getText("btnSave")) {
            var oTable = oView.byId(TABLE_CHANGE_ASSIGN);
            var tableModel = oTable.getModel(PROVISION_SAVE_MODEL);

            if (!self._isRowSelected(oTable)) return false;

            var path = oTable.getSelectedContextPaths()[0];
            var obj = tableModel.getObject(path);

            var aFiltersPreview = provisionView.getProperty(
              "/ProvisionPreviewFiltersGeneric"
            );
            aFiltersPreview.push(self.setFilterEQWithKey("Belnr", obj.Belnr));
            aFiltersPreview.push(self.setFilterEQWithKey("Blpos", obj.Blpos));

            provisionView.setProperty(
              "/ProvisionPreviewFilters",
              aFiltersPreview
            );

            self._readEntity(
              ENTITY_PROVISION_PREVIEW_SET,
              PROVISION_PREVIEW_MODEL,
              aFiltersPreview,
              sZStatoCla
            );
          }
        },

        _fetchApi: function (url, oParam, sMessage) {
          var self = this,
            oDataModel = self.getModel();
          self.getView().setBusy(true);
          oDataModel.callFunction("/" + url, {
            method: "GET",
            urlParameters: oParam,
            success: function (oData, response) {
              self.getView().setBusy(false);
              self.destroyBusyDialog();
              self.oDialogWarn.close();
              if (oData.IsOk) {
                self._setMessage(
                  "titleDialogEndOperation",
                  sMessage,
                  "success"
                );
                self._setMessage(
                  "titleDialogCallOperation",
                  "msgDialogEndOperation",
                  "success"
                );
              } else {
                self._setMessage(
                  "titleDialogError",
                  oData.MessageText,
                  "error"
                );
              }
              console.log(oData); //TODO:da canc
            },
            error: function (oError) {
              self.getView().setBusy(false);
              self.destroyBusyDialog();
              self.oDialogWarn.close();
              self._setMessage("titleDialogError", oError.message, "error");
            },
          });
        },

        _fetchApi_old: function (url, oParam, sMessage) {
          var self = this;
          self.getView().setBusy(true);
          try {
            $.ajax({
              type: "GET",
              url: url,
              contentType: "application/json",
              dataType: "json",
              data: oParam,
            }).always(function (data) {
              self.getView().setBusy(false);
              self.destroyBusyDialog();
              self.oDialogWarn.close();
              if (data.d.IsOk) {
                self._setMessage(
                  "titleDialogEndOperation",
                  sMessage,
                  "success"
                );
                self._setMessage(
                  "titleDialogCallOperation",
                  "msgDialogEndOperation",
                  "success"
                );
              } else {
                self._setMessage(
                  "titleDialogError",
                  data.d.MessageText,
                  "error"
                );
              }
            });
          } catch (error) {
            self.getView().setBusy(false);
          }
        },

        _setMessage: function (sTitle, sText, sType) {
          var self = this;
          var oBundle = self.getResourceBundle();
          var obj = {
            title: oBundle.getText(sTitle),
            onClose: function (oAction) {},
          };
          if (sType === "error")
            sap.m.MessageBox.error(oBundle.getText(sText), obj);
          else if (sType === "success")
            sap.m.MessageBox.success(oBundle.getText(sText), obj);
          else if (sType === "warning")
            sap.m.MessageBox.warning(oBundle.getText(sText), obj);
        },

        _getActionResponse: function () {
          var self = this;
          var oBundle = self.getResourceBundle();
          var provisionView = self.getModel(PROVISION_MODEL);
          var sZStatoCla = provisionView.getProperty("/ZStatoCla");
          var sMessage = null;

          var sZCodCla = provisionView.getProperty("/ZCodCla");
          var sFipex = provisionView.getProperty("/FipexEng");
          var sFistl = provisionView.getProperty("/FistlEng");
          var sGeber = provisionView.getProperty("/GeberEng");

          var oParam = {
            ZCodCla: sZCodCla,
            Fipex: sFipex,
            Fistl: sFistl,
            Geber: sGeber,
          };

          if (sZStatoCla === "00") {
            var sZidIpe = provisionView.getProperty("/ZidIpe");
            oParam["ZidIpe"] = sZidIpe;

            sMessage = oBundle.getText("msgDialogEndChange");
            self._fetchApi(URL_F_CHANGE, oParam, sMessage);
          } else if (sZStatoCla === "02") {
            sMessage = oBundle.getText("msgDialogEndAssign");
            self._fetchApi(URL_F_ASSIGN, oParam, sMessage);
          } else if (sZStatoCla === "01") {
            sMessage = oBundle.getText("msgDialogEndActive");
            self._fetchApi(URL_F_ACTIVATE, oParam, sMessage);
          }
        },

        onNavBack: function () {
          var sPreviousHash = History.getInstance().getPreviousHash();
          if (sPreviousHash !== undefined) {
            // eslint-disable-next-line sap-no-history-manipulation
            history.go(-1);
          } else {
            this.getRouter().navTo("worklist", {}, true);
          }
        },
        _resetOnMatched: function (sZStatoCla, sZcodiKErrore) {
          var self = this;
          var provisionView = self.getModel(PROVISION_MODEL);
          var oView = self.getView();

          oView.byId("idPanelChange").setVisible(false);
          oView.byId("idPanelChangeAssign").setVisible(false);
          oView.byId("idPanelChangeActive").setVisible(false);
          oView.byId("idPanelAssign").setVisible(false);
          oView.byId("idPanelActive").setVisible(false);
          provisionView.setProperty("/ZStatoCla", sZStatoCla);
          provisionView.setProperty("/ZcodiKErrore", sZcodiKErrore);
          provisionView.setProperty("/ZCodIpe", "");
          provisionView.setProperty("/ZCodCla", "");
          provisionView.setProperty("/FipexEng", "");
          provisionView.setProperty("/FistlEng", "");
          provisionView.setProperty("/ZgeberEng", "");
          provisionView.setProperty("/ZidIpe", "");
          provisionView.setProperty("/ProvisionSaveTotal", null);
          provisionView.setProperty("/ProvisionItemsTotal", null);
          provisionView.setProperty("/ProvisionPreviewTotal", null);
          provisionView.setProperty("/titleTable", null);
          provisionView.setProperty("/isActive", null);
          self.resetPaginator(PAGINATOR_MODEL);
        },
        _setVisiblePanel: function (oParameters) {
          var self = this;
          var oView = self.getView();
          var sZstatoCla = oParameters.ZStatoCla;
          if (sZstatoCla === "00") {
            oView.byId("idPanelChangeActive").setVisible(true);
          } else if (sZstatoCla === "01") {
            oView.byId("idPanelActive").setVisible(true);
          } else if (sZstatoCla === "02") {
            oView.byId("idPanelAssign").setVisible(true);
          }
        },

        _setButtonEnabled: function (data) {
          var self = this;
          var oBundle = self.getResourceBundle();
          var provisionView = self.getModel(PROVISION_MODEL);
          var sZStatoCla = provisionView.getProperty("/ZStatoCla");
          var sZcodiKErrore = provisionView.getProperty("/ZcodiKErrore");

          if (sZStatoCla === "00") {
            provisionView.setProperty(
              "/btnAction",
              oBundle.getText("btnChange")
            );

            if (data["Change"]) {
              provisionView.setProperty("/buttonEnabled", true);
            } else {
              provisionView.setProperty("/buttonEnabled", false);
            }
          } else if (sZStatoCla === "01") {
            provisionView.setProperty(
              "/btnAction",
              oBundle.getText("btnActive")
            );

            if (data["Active"] /*&& sZcodiKErrore === "1"*/) {
              provisionView.setProperty("/buttonEnabled", true);
            } else {
              provisionView.setProperty("/buttonEnabled", false);
            }
          } else if (sZStatoCla === "02") {
            provisionView.setProperty(
              "/btnAction",
              oBundle.getText("btnAssign")
            );

            if (data["Assign"] /*&& sZcodiKErrore === "4"*/) {
              provisionView.setProperty("/buttonEnabled", true);
            } else provisionView.setProperty("/buttonEnabled", false);

            provisionView.setProperty("/buttonEnabled", true);
          }
        },

        _createKeyPath: function (oParameters, pathModel) {
          var self = this;
          var path = self.getModel().createKey(pathModel, {
            Gjahr: oParameters.Gjahr,
            Zammin: oParameters.Zammin,
            Zufficioliv1: oParameters.Zufficioliv1,
            Zufficioliv2: oParameters.Zufficioliv2,
            Zcoddecr: oParameters.Zcoddecr,
            ZCodIpe: oParameters.ZCodIpe,
            ZNumCla: oParameters.ZNumCla,
            ZCodCla: oParameters.ZCodCla,
          });
          return path;
        },
        _onObjectMatched: function (oEvent) {
          var self = this,
            oParameters = oEvent.getParameter("arguments"),
            oDataModel = self.getModel(),
            oView = self.getView();
          self._resetOnMatched(oParameters.ZStatoCla, "");
          self._setVisiblePanel(oParameters);
          sAgrName = oParameters.AgrName;
          sFikrs = oParameters.AuthorityFikrs;
          sPrctr = oParameters.AuthorityPrctr;

          var oFilterProvision = {
            AgrName: oParameters.AgrName,
            AuthorityFikrs: oParameters.AuthorityFikrs,
            AuthorityPrctr: oParameters.AuthorityPrctr,
          };
          delete oParameters.AgrName;
          delete oParameters.AuthorityFikrs;
          delete oParameters.AuthorityPrctr;
          oView.setBusy(true);

          var path = self._createKeyPath(oParameters, ENTITY_PROVISION_SET);

          self
            .getModel()
            .metadataLoaded()
            .then(function () {
              oDataModel.read("/" + path, {
                urlParameters: oFilterProvision,
                success: function (data, oResponse) {
                  var oModelJson = new sap.ui.model.json.JSONModel();
                  oModelJson.setData(data);

                  oView.setModel(oModelJson, PROVISION_SET_MODEL);
                  var sFipexEng = data["FipexEng"];
                  var sFistlEng = data["FistlEng"];
                  var sZcodiKErrore = data["ZcodiKErrore"];
                  var sZCodCla = data["ZCodCla"];
                  self.getModel(PROVISION_MODEL).setProperty("/Fikrs", sFikrs);
                  self
                    .getModel(PROVISION_MODEL)
                    .setProperty("/ZCodCla", sZCodCla);
                  self
                    .getModel(PROVISION_MODEL)
                    .setProperty("/ZcodiKErrore", sZcodiKErrore);

                  self
                    .getModel(PROVISION_MODEL)
                    .setProperty("/GeberEng", data["GeberEng"]);
                  self
                    .getModel(PROVISION_MODEL)
                    .setProperty("/GeberEvg", data["GeberEvg"]);

                  self._setVisibility();

                  self._configEntityFilters(sFipexEng, sFistlEng, oParameters);
                },
                error: function (error) {
                  var oView = self.getView();
                  oView.setBusy(false);
                },
              });
            });
        },

        _readEntityRettifica: function (
          pathModel,
          nameModel,
          aFilters,
          ZStatoCla,
          forPagination = false,
          callback
        ) {
          var self = this;
          var oView = self.getView();
          var oDataModel = self.getModel();
          oView.setBusy(true);
          var urlParameters = self._setUrlParameters(
            nameModel,
            ZStatoCla,
            forPagination
          );
          self
            .getModel()
            .metadataLoaded()
            .then(function () {
              oDataModel.read("/" + pathModel, {
                filters: aFilters,
                urlParameters: urlParameters,
                success: function (data, oResponse) {
                  callback(true);
                  self._manageResult(data, nameModel, forPagination);
                },
                error: function (error) {
                  callback(false);
                  oView.setBusy(false);
                },
              });
            });
        },

        _readEntity: function (
          pathModel,
          nameModel,
          aFilters,
          ZStatoCla,
          forPagination = false
        ) {
          var self = this;
          var oView = self.getView();
          var oDataModel = self.getModel();
          oView.setBusy(true);
          var urlParameters = self._setUrlParameters(
            nameModel,
            ZStatoCla,
            forPagination
          );
          self
            .getModel()
            .metadataLoaded()
            .then(function () {
              oDataModel.read("/" + pathModel, {
                filters: aFilters,
                urlParameters: urlParameters,
                success: function (data, oResponse) {
                  self._manageResult(data, nameModel, forPagination);
                },
                error: function (error) {
                  oView.setBusy(false);
                },
              });
            });
        },
        onSelectedAssign: function () {
          var self = this;
          var provisionView = self.getModel(PROVISION_MODEL);
          var sZStatoCla = provisionView.getProperty("/ZStatoCla");
          if (sZStatoCla === "02") {
            var oTable = self.getView().byId(TABLE_ASSIGN);
            var oTableModel = oTable.getModel(PROVISION_ITEMS_MODEL);
            var sPathItem = oTable.getSelectedContextPaths()[0];
            var oItem = oTableModel.getObject(sPathItem);

            provisionView.setProperty("/FipexEng", oItem.FipexEng);
            provisionView.setProperty("/FistlEng", oItem.FistlEng);
            provisionView.setProperty("/ZgeberEng", oItem.ZgeberEng);
          }
        },

        _setUrlParameters: function (nameModel, ZStatoCla, forPagination) {
          var self = this;
          var paginatorModel = self.getModel(PAGINATOR_MODEL);
          var numRecordsForPage =
            paginatorModel.getProperty("/stepInputDefault");

          var obj = {
            Stato: ZStatoCla,
            AgrName: sAgrName,
            AuthorityFikrs: sFikrs,
            AuthorityPrctr: sPrctr,
          };
          if (nameModel === BENEFICIARY_MODEL) {
            obj = {};
          } else if (nameModel === PROVISION_PREVIEW_MODEL) {
          }
          return obj;
        },

        _manageResult: function (data, nameModel, forPagination) {
          var self = this;
          var oView = self.getView();
          var oBundle = self.getResourceBundle();
          var dataModel = data.results;
          var bCount = true;
          var provisionView = self.getModel(PROVISION_MODEL);
          var oModelJson = new sap.ui.model.json.JSONModel();
          if (nameModel === BENEFICIARY_MODEL) {
            dataModel = data;
            bCount = false;
          } else if (nameModel === PROVISION_ITEMS_MODEL) {
            provisionView.setProperty("/FipexEng", data.results[0]?.FipexEng);
            provisionView.setProperty("/FistlEng", data.results[0]?.FistlEng);
            provisionView.setProperty("/ZgeberEng", data.results[0]?.ZgeberEng);

            var obj = data.results[0];
            provisionView.setProperty("/isActive", obj.IsActive);
          } else if (nameModel === PROVISION_PREVIEW_MODEL) {
            provisionView.setProperty("/ZCodIpe", data.results[0]?.ZCodIpe);
            provisionView.setProperty("/FipexEng", data.results[0]?.FipexPost);
            provisionView.setProperty("/FistlEng", data.results[0]?.FistlPost);
            provisionView.setProperty("/ZgeberEng", data.results[0]?.GeberPost);
            provisionView.setProperty("/ZidIpe", data.results[0]?.ZidIpe);

            oView.byId("idPanelChange").setVisible(true);
            oView.byId("idPanelChangeAssign").setVisible(false);
            // oView.byId("idPositionLabel").setVisible(false);
            // oView.byId("idStructureLabel").setVisible(false);
            // oView.byId("idAuthLabel").setVisible(false);
            // oView.byId("idPositionText").setVisible(false);
            // oView.byId("idStructureText").setVisible(false);
            // oView.byId("idAuthText").setVisible(false);

            provisionView.setProperty(
              "/btnAction",
              oBundle.getText("btnActive")
            );
          }

          if (forPagination) bCount = false;
          if (bCount) self._counterRecords();
          oModelJson.setData(dataModel);
          oView.setModel(oModelJson, nameModel);
          oView.setBusy(false);
        },

        _configEntityFilters: function (sFipexEng, sFistlEng, oParameters) {
          var self = this,
            aFiltersProvisionItems = [],
            aFiltersProvisionSave = [],
            aFiltersPreview = [],
            provisionView = self.getModel(PROVISION_MODEL);

          var path = self._createKeyPath(oParameters, ENTITY_BENEFICIARY_SET);

          self._readEntity(path, BENEFICIARY_MODEL, [], oParameters.ZStatoCla);

          aFiltersProvisionItems.push(
            self.setFilterEQWithKey("FipexEng", sFipexEng)
          );
          aFiltersProvisionItems.push(
            self.setFilterEQWithKey("FistlEng", sFistlEng)
          );

          aFiltersProvisionItems.push(
            self.setFilterEQWithKey("ZCodCla", oParameters.ZCodCla)
          );
          aFiltersProvisionItems.push(
            self.setFilterEQWithKey("ZStatoCla", oParameters.ZStatoCla)
          );

          provisionView.setProperty(
            "/ProvisionItemsFilters",
            aFiltersProvisionItems
          );

          self._readEntity(
            ENTITY_PROVISION_ITEMS_SET,
            PROVISION_ITEMS_MODEL,
            aFiltersProvisionItems,
            oParameters.ZStatoCla
          );

          aFiltersProvisionSave.push(
            self.setFilterEQWithKey("ZCodCla", oParameters.ZCodCla)
          );
          aFiltersProvisionSave.push(
            self.setFilterEQWithKey("ZStatoCla", "02")
          );

          provisionView.setProperty(
            "/ProvisionSaveFilters",
            aFiltersProvisionSave
          );

          aFiltersPreview.push(
            self.setFilterEQWithKey("Gjahr", oParameters.Gjahr)
          );
          aFiltersPreview.push(
            self.setFilterEQWithKey("Zammin", oParameters.Zammin)
          );
          aFiltersPreview.push(
            self.setFilterEQWithKey("Zufficioliv1", oParameters.Zufficioliv1)
          );
          aFiltersPreview.push(
            self.setFilterEQWithKey("Zufficioliv2", oParameters.Zufficioliv2)
          );
          aFiltersPreview.push(
            self.setFilterEQWithKey("Zcoddecr", oParameters.Zcoddecr)
          );
          aFiltersPreview.push(
            self.setFilterEQWithKey("ZCodIpe", oParameters.ZCodIpe)
          );
          aFiltersPreview.push(
            self.setFilterEQWithKey("ZNumCla", oParameters.ZNumCla)
          );
          aFiltersPreview.push(
            self.setFilterEQWithKey("ZCodCla", oParameters.ZCodCla)
          );

          provisionView.setProperty(
            "/ProvisionPreviewFiltersGeneric",
            aFiltersPreview
          );
        },

        _counterRecords: function () {
          var self = this,
            oDataModel = self.getModel(),
            paginatorModel = self.getModel(PAGINATOR_MODEL),
            provisionModel = self.getModel(PROVISION_MODEL),
            numRecordsForPage = paginatorModel.getProperty("/stepInputDefault");

          self.resetPaginator(PAGINATOR_MODEL);
          self.getView().setBusy(true);

          var [pathModel, nameModel, sZStatoCla] =
            self._configPropertiesPagination();

          var aFilters = provisionModel.getProperty(
            "/" + nameModel + "Filters"
          );

          self
            .getModel()
            .metadataLoaded()
            .then(function () {
              oDataModel.read("/" + pathModel + "/$count", {
                filters: aFilters,
                urlParameters: {
                  Stato: sZStatoCla,
                  AgrName: sAgrName,
                  AuthorityFikrs: sFikrs,
                  AuthorityPrctr: sPrctr,
                },
                success: function (data, oResponse) {
                  provisionModel.setProperty("/" + nameModel + "Total", data);

                  var sTitle = self._configTitleTable(sZStatoCla, data);

                  provisionModel.setProperty("/titleTable", sTitle);

                  if (data > numRecordsForPage) {
                    paginatorModel.setProperty("/btnLastEnabled", true);
                    self.paginatorTotalPage = data / numRecordsForPage;
                    var moduleN = Number.isInteger(self.paginatorTotalPage);
                    if (!moduleN) {
                      self.paginatorTotalPage =
                        Math.trunc(self.paginatorTotalPage) + 1;
                    }
                    paginatorModel.setProperty(
                      "/" + nameModel + "MaxPage",
                      self.paginatorTotalPage
                    );
                    paginatorModel.setProperty(
                      "/maxPage",
                      self.paginatorTotalPage
                    );
                  } else {
                    paginatorModel.setProperty("/btnLastEnabled", false);
                    paginatorModel.setProperty("/btnFirstEnabled", false);
                    paginatorModel.setProperty("/" + nameModel + "MaxPage", 1);
                    paginatorModel.setProperty("/maxPage", 1);
                  }
                  self.getView().setBusy(false);
                },
                error: function (error) {
                  self.getView().setBusy(false);
                },
              });
            });
        },

        _configPropertiesPagination: function (forMaxPage = false) {
          var self = this,
            pathModel = null,
            nameModel = null,
            oBundle = self.getResourceBundle(),
            sZStatoCla = null,
            maxPage = null,
            info = null,
            paginatorModel = self.getModel(PAGINATOR_MODEL),
            provisionModel = self.getModel(PROVISION_MODEL),
            sZStatoCla = provisionModel.getProperty("/ZStatoCla"),
            btnAction = provisionModel.getProperty("/btnAction");

          if (btnAction === oBundle.getText("btnSave")) {
            pathModel = ENTITY_PROVISION_ITEMS_SET;
            nameModel = PROVISION_SAVE_MODEL;
            !forMaxPage
              ? (sZStatoCla = "02")
              : (maxPage = paginatorModel.getProperty(
                  "/" + PROVISION_SAVE_MODEL + "MaxPage"
                ));
          } else if (
            btnAction === oBundle.getText("btnActive") &&
            sZStatoCla === "00"
          ) {
            pathModel = ENTITY_PROVISION_PREVIEW_SET;
            nameModel = PROVISION_PREVIEW_MODEL;
            !forMaxPage
              ? (sZStatoCla = sZStatoCla)
              : (maxPage = paginatorModel.getProperty(
                  "/" + PROVISION_PREVIEW_MODEL + "MaxPage"
                ));
          } else {
            pathModel = ENTITY_PROVISION_ITEMS_SET;
            nameModel = PROVISION_ITEMS_MODEL;
            !forMaxPage
              ? (sZStatoCla = sZStatoCla)
              : (maxPage = paginatorModel.getProperty(
                  "/" + PROVISION_ITEMS_MODEL + "MaxPage"
                ));
          }
          !forMaxPage ? (info = sZStatoCla) : (info = maxPage);
          return [pathModel, nameModel, info];
        },

        _configTitleTable: function (sZStatoCla, iTotalItems) {
          var self = this,
            sTitle = null,
            oBundle = self.getResourceBundle(),
            provisionModel = self.getModel(PROVISION_MODEL),
            btnAction = provisionModel.getProperty("/btnAction");
          if (
            btnAction === oBundle.getText("btnSave") ||
            (btnAction === oBundle.getText("btnActive") && sZStatoCla === "00")
          ) {
            sTitle = oBundle.getText("tableTitleDetailsChangeCount", [
              iTotalItems,
            ]);
          } else if (btnAction === oBundle.getText("btnChange")) {
            sTitle = oBundle.getText("tableTitleDetailsChange");
          } else if (btnAction === oBundle.getText("btnAssign")) {
            sTitle = oBundle.getText("tableTitleDetailsAssignCount", [
              iTotalItems,
            ]);
          } else if (
            btnAction === oBundle.getText("btnActive") &&
            sZStatoCla === "01"
          ) {
            sTitle = oBundle.getText("tableTitleDetailsActive");
          }
          return sTitle;
        },
        _searchByPaginator: function () {
          var self = this,
            oView = self.getView(),
            provisionModel = self.getModel(PROVISION_MODEL);

          oView.setBusy(true);

          var [pathModel, nameModel, sZStatoCla] =
            self._configPropertiesPagination();

          var aFilters = provisionModel.getProperty(
            "/" + nameModel + "Filters"
          );

          self._readEntity(pathModel, nameModel, aFilters, sZStatoCla, true);
        },

        onFirstPaginator: function (oEvent) {
          var self = this;
          self.getFirstPaginator(PAGINATOR_MODEL);
          self._searchByPaginator();
        },

        onLastPaginator: function (oEvent) {
          var self = this;
          self.getLastPaginator(PAGINATOR_MODEL);
          self._searchByPaginator();
        },

        onChangePage: function (oEvent) {
          var self = this,
            maxPage = null;

          var [pathModel, nameModel, maxPage] =
            self._configPropertiesPagination(true);

          self.getChangePage(PAGINATOR_MODEL, maxPage);
          self._searchByPaginator();
        },
      }
    );
  }
);
