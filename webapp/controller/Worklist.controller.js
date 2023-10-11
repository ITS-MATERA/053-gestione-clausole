sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/MessageBox",
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet",
    "../model/models",
    "sap/m/Dialog",
  ],
  function (
    BaseController,
    JSONModel,
    formatter,
    MessageBox,
    exportLibrary,
    Spreadsheet,
    model
  ) {
    "use strict";
    const PAGINATOR_MODEL = "paginatorModel";
    const WORKLIST_MODEL = "worklistView";
    const ENTITY_PROVISION_SET = "ProvisionSet";
    const PROVISION_MODEL = "Provision";
    const PROVISION_EXPORT_MODEL = "ProvisionExport";
    const FILTER_SEM_OBJ = "ZS4_FUNZ_IMP_ATT_CLA_SRV";
    const FILTER_AUTH_OBJ = "Z_GEST_CLA";
    const VISIBILITY_MODEL = "ZSS4_CA_CONI_VISIBILITA_SRV";
    const VISIBILITY_ENTITY = "ZES_CONIAUTH_SET";
    const TABLE_PROVISIONS = "tableProvisions";
    const ACTIVITY_CHECK_MODEL = "ActivityCheck";
    const USER_MODEL = "userParamsModel";

    const EDM_TYPE = exportLibrary.EdmType;

    var sAgrName;
    var sFikrs;
    var sPrctr;

    return BaseController.extend(
      "gestioneattivazioneclausole.controller.Worklist",
      {
        formatter: formatter,

        onInit: function () {
          var self = this,
            oBundle = self.getResourceBundle(),
            oViewModel,
            oViewModelPaginator;

          oViewModel = new JSONModel({
            worklistTableTitle: oBundle.getText("worklistTableTitle"),
            tableNoDataText: oBundle.getText("tableNoDataText"),
            total: 0,
            // tableBusyDelay: 0,
            defaultDateFrom: formatter.defaultFormatDate(new Date()),
            defaultDateTo: formatter.defaultFormatDate(new Date()),
          });

          oViewModelPaginator = new JSONModel({
            btnPrevEnabled: false,
            btnFirstEnabled: false,
            btnNextEnabled: false,
            btnLastEnabled: false,
            recordForPageEnabled: false,
            currentPageEnabled: true,
            stepInputDefault: 20,
            currentPage: 1,
            maxPage: 1,
            paginatorSkip: 0,
            paginatorClick: 0,
          });

          var oViewModelUserParams = new JSONModel({
            fik: null,
            buk: null,
            prc: null,
          });

          self.setModel(oViewModelUserParams, USER_MODEL);
          self.setModel(oViewModel, WORKLIST_MODEL);
          self.setModel(oViewModelPaginator, PAGINATOR_MODEL);

          var oInputfFdatkFrom = self.getView().byId("fFdatkFrom");
          var oInputfFdatkTo = self.getView().byId("fFdatkTo");

          oInputfFdatkFrom.attachBrowserEvent(
            "keypress",
            formatter.acceptOnlyNumbersFdatk
          );

          oInputfFdatkTo.attachBrowserEvent(
            "keypress",
            formatter.acceptOnlyNumbersFdatk
          );
        },

        //ACTIVITY CHECK
        onBeforeRendering: async function () {
          var self = this,
            oAuthModel = self.getModel(VISIBILITY_MODEL),
            btnStart = self.getView().byId("btnStart"),
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

                  var bACTV_3 = self.isIncluded(aResults, "ACTV_3", "Z03");

                  if (bACTV_3) {
                    btnStart.setEnabled(true);
                  } else {
                    btnStart.setEnabled(false);
                  }
                  var oModel = new sap.ui.model.json.JSONModel();

                  oModel.setData(rec);
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

        onUpdateFinished: function (oEvent) {
          var self = this,
            sTitle,
            oBundle = self.getResourceBundle(),
            oTable = oEvent.getSource(),
            workListModel = self.getModel(WORKLIST_MODEL),
            iTotalItems = workListModel.getProperty("/total");

          if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
            sTitle = oBundle.getText("tableTitleOverviewCount", [iTotalItems]);
          } else {
            sTitle = oBundle.getText("tableTitleOverview", [iTotalItems]);
          }
          workListModel.setProperty("/tableTitleOverview", sTitle);
        },

        onSelectedItem: function () {
          var self = this;
          var oTable = self.getView().byId(TABLE_PROVISIONS);
          var oTableModel = oTable.getModel(PROVISION_MODEL);
          var sPathItem = oTable.getSelectedContextPaths()[0];

          var oItem = oTableModel.getObject(sPathItem);
          var btnDetails = self.getView().byId("idBtnDetails");

          var dToday = new Date();
          var dYear = dToday.getFullYear().toString();

          if (oItem.ZStatoCla === "00" && dYear !== oItem.FdatkYear) {
            btnDetails.setEnabled(false);
          } else btnDetails.setEnabled(true);

          btnDetails.setEnabled(true);
        },

        onNavBack: function () {
          // eslint-disable-next-line sap-no-history-manipulation
          history.go(-1);
        },

        onStart: function (oEvent) {
          var self = this;

          self.resetPaginator(PAGINATOR_MODEL);
          self._setEntityProperties();
        },

        onToggle: function (oEvent) {
          var self = this,
            oView = self.getView(),
            oBundle = self.getResourceBundle();

          var btnArrow = oView.byId("btnToggle");
          var panelFilter = oView.byId("_idVBoxGridToolBar");
          if (btnArrow.getIcon() === "sap-icon://slim-arrow-up") {
            btnArrow.setIcon("sap-icon://slim-arrow-down");
            btnArrow.setTooltip(oBundle.getText("tooltipArrowShow"));
            panelFilter.setVisible(false);
          } else {
            btnArrow.setIcon("sap-icon://slim-arrow-up");
            btnArrow.setTooltip(oBundle.getText("tooltipArrowHide"));
            panelFilter.setVisible(true);
          }
        },

        onBlockToggle: function () {
          var self = this,
            oView = self.getView();

          var btnArrow = oView.byId("btnToggle");
          btnArrow.getEnabled()
            ? btnArrow.setEnabled(false)
            : btnArrow.setEnabled(true);
        },

        onDetails: function (oEvent) {
          var self = this,
            oView = self.getView(),
            oTable = oView.byId(TABLE_PROVISIONS),
            tableModel = oTable.getModel(PROVISION_MODEL),
            oBundle = self.getResourceBundle();

          if (oTable.getSelectedContextPaths().length === 0) {
            MessageBox.warning(oBundle.getText("msgNoRowSelected"), {
              title: oBundle.getText("titleDialogWarning"),
              onClose: function (oAction) {},
            });
            return false;
          }

          var path = oTable.getSelectedContextPaths()[0];
          var obj = tableModel.getObject(path);
          self.getRouter().navTo("provision", {
            Gjahr: obj.Gjahr,
            Zammin: obj.Zammin,
            Zufficioliv1: obj.Zufficioliv1,
            Zufficioliv2: obj.Zufficioliv2,
            Zcoddecr: obj.Zcoddecr,
            ZCodIpe: obj.ZCodIpe,
            ZNumCla: obj.ZNumCla,
            ZCodCla: obj.ZCodCla,
            ZStatoCla: obj.ZStatoCla,
            AgrName: sAgrName,
            AuthorityFikrs: sFikrs,
            AuthorityPrctr: sPrctr,
          });
        },
        onExport: function (oEvent) {
          var oSheet;
          var self = this;
          var oBundle = self.getResourceBundle();

          var oTable = self.getView().byId(TABLE_PROVISIONS);
          var oTableModel = oTable.getModel("Provision");

          var aCols = self._createColumnConfig();
          var oSettings = {
            workbook: {
              columns: aCols,
            },
            dataSource: oTableModel.getData(),
            fileName: oBundle.getText("fileName"),
          };

          oSheet = new Spreadsheet(oSettings);
          oSheet.build().finally(function () {
            oSheet.destroy();
          });
        },

        _setEntityProperties: function () {
          var self = this,
            oDataModel = self.getModel(),
            oView = self.getView(),
            paginatorModel = self.getModel(PAGINATOR_MODEL),
            numRecordsForPage = paginatorModel.getProperty("/stepInputDefault"),
            oBundle = self.getResourceBundle();

          self.resetEntityModel(PROVISION_EXPORT_MODEL);
          self.resetEntityModel(PROVISION_MODEL);

          var headerObject = self.getHeaderFilter();

          if (!headerObject.isValidate) {
            MessageBox.warning(
              oBundle.getText(headerObject.validationMessage),
              {
                title: oBundle.getText("titleDialogWarning"),
                onClose: function (oAction) {},
              }
            );
            return false;
          }
          oView.setBusy(true);

          self._getEntityProvision();
        },

        _getEntityProvision: function (forExport = false) {
          var self = this,
            obj = {},
            oDataModel = self.getModel(),
            nameModel = null,
            oView = self.getView(),
            paginatorModel = self.getModel(PAGINATOR_MODEL),
            numRecordsForPage = paginatorModel.getProperty("/stepInputDefault");

          self.getView().setBusy(true);
          if (forExport) {
            obj = {
              AgrName: sAgrName,
              AuthorityFikrs: sFikrs,
              AuthorityPrctr: sPrctr,
            };
            nameModel = PROVISION_EXPORT_MODEL;
          } else {
            obj = {
              AgrName: sAgrName,
              AuthorityFikrs: sFikrs,
              AuthorityPrctr: sPrctr,
            };
            nameModel = PROVISION_MODEL;
          }

          var headerObject = self.getHeaderFilter();
          self
            .getModel()
            .metadataLoaded()
            .then(function () {
              oDataModel.read("/" + ENTITY_PROVISION_SET, {
                urlParameters: obj,
                filters: headerObject.filters,
                success: function (data, oResponse) {
                  var oModelJson = new sap.ui.model.json.JSONModel();
                  oModelJson.setData(data.results);
                  oView.setModel(oModelJson, nameModel);

                  var mex = JSON.parse(oResponse.headers["sap-message"]);
                  var total = parseInt(mex.message);

                  self.getModel(WORKLIST_MODEL).setProperty("/total", total);
                  if (total > numRecordsForPage) {
                    paginatorModel.setProperty("/btnLastEnabled", true);
                    self.paginatorTotalPage = total / numRecordsForPage;
                    var moduleN = Number.isInteger(self.paginatorTotalPage);
                    if (!moduleN) {
                      self.paginatorTotalPage =
                        Math.trunc(self.paginatorTotalPage) + 1;
                    }
                    paginatorModel.setProperty(
                      "/maxPage",
                      self.paginatorTotalPage
                    );
                  } else {
                    paginatorModel.setProperty("/maxPage", 1);
                    paginatorModel.setProperty("/btnLastEnabled", false);
                  }
                  oView.setBusy(false);
                },
                error: function (error) {
                  oView.setBusy(false);
                },
              });
            });
        },

        _createColumnConfig: function () {
          var self = this;
          var sColLabel = "tableNameColumn";
          var oBundle = self.getResourceBundle();
          var aCols = [
            {
              label: oBundle.getText(sColLabel + "Gjahr"),
              property: "Gjahr",
              type: EDM_TYPE.String,
            },
            {
              label: oBundle.getText(sColLabel + "Zammin"),
              property: "Zammin",
              type: EDM_TYPE.String,
            },
            {
              label: oBundle.getText(sColLabel + "Zufficioliv1"),
              property: "Zufficioliv1",
              type: EDM_TYPE.String,
            },
            {
              label: oBundle.getText(sColLabel + "Zufficioliv2"),
              property: "Zufficioliv2",
              type: EDM_TYPE.String,
            },
            {
              label: oBundle.getText(sColLabel + "Zcoddecr"),
              property: "Zcoddecr",
              type: EDM_TYPE.String,
            },
            {
              label: oBundle.getText(sColLabel + "ZCodIpe"),
              property: "ZCodIpe",
              type: EDM_TYPE.String,
            },
            {
              label: oBundle.getText(sColLabel + "ZNumCla"),
              property: "ZNumCla",
              type: EDM_TYPE.String,
            },
            {
              label: oBundle.getText(sColLabel + "Fdatk"),
              property: "Fdatk",
              type: EDM_TYPE.Date,
              format: "yyyy",
              textAlign: "left",
            },
            {
              label: oBundle.getText(sColLabel + "ZImpIpeCl"),
              property: "ZImpIpeCl",
              type: EDM_TYPE.Currency,
            },
            {
              label: oBundle.getText(sColLabel + "Ktext"),
              property: "ZoggSpesIm",
              type: EDM_TYPE.String,
            },
            {
              label: oBundle.getText(sColLabel + "ZStatoCla"),
              property: "ZStatoCla",
              type: EDM_TYPE.Enumeration,
              valueMap: {
                "00": oBundle.getText("status00"),
                "01": oBundle.getText("status01"),
                "02": oBundle.getText("status02"),
              },
            },
          ];

          return aCols;
        },
      }
    );
  }
);
