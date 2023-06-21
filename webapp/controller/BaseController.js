sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/library",
    "../model/formatter",
    "sap/m/Token",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Button",
  ],
  function (Controller, UIComponent, formatter) {
    "use strict";
    const EQ = sap.ui.model.FilterOperator.EQ;
    const BT = sap.ui.model.FilterOperator.BT;
    const FILTER = sap.ui.model.Filter;
    const ENTITY_USERPARAMETERS_SET = "UserParametersSet";
    const USER_MODEL = "ESH_SEARCH_SRV";

    return Controller.extend(
      "gestioneattivazioneclausole.controller.BaseController",
      {
        formatter: formatter,

        /**
         * Convenience method for accessing the router.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
          return UIComponent.getRouterFor(this);
        },

        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
          return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
          return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
          return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        resetEntityModel: function (nameModel) {
          var self = this;
          var oView = self.getView();
          var oModelJson = new sap.ui.model.json.JSONModel();
          oModelJson.setData({});
          oView.setModel(oModelJson, nameModel);
        },
        isIncluded: function (array, param, value) {
          return array.filter((x) => x[param] === value).length > 0;
        },

        loadUserParameter: function (value, oModel, oUser) {
          var self = this;
          var oDataModel = self.getModel();
          var sUser = oUser.getProperty("/currentUser");
          if (sUser === undefined) sUser = "";
          var pathModel = oDataModel.createKey(ENTITY_USERPARAMETERS_SET, {
            User: sUser,
            Name: value,
          });
          self
            .getModel()
            .metadataLoaded()
            .then(function () {
              oDataModel.read("/" + pathModel, {
                success: function (data) {
                  oModel.setProperty("/" + value.toLowerCase(), data.Value);
                },
                error: function (error) {},
              });
            });
        },
        getCurrentUser: function (oModel) {
          var self = this;
          var oDataModel = self.getModel(USER_MODEL);
          var pathModel = "Users('<current>')";

          self
            .getModel()
            .metadataLoaded()
            .then(function () {
              oDataModel.read("/" + pathModel, {
                success: function (data) {
                  oModel.setProperty("/" + "currentUser", data.Id);
                  return data.Id;
                },
                error: function (error) {},
              });
            });
        },

        /* BUSY DIALOG START */

        createBusyDialog: function () {
          var self = this,
            oView = self.getView();
          if (!self.__busyDialog) {
            self.__busyDialog = sap.ui.xmlfragment(
              oView.getId(),
              "gestioneattivazioneclausole.view.fragment.busy.BusyDialog",
              self
            );
            oView.addDependent(self.__busyDialog);
          }

          jQuery.sap.syncStyleClass(
            "sapUiSizeCompact",
            oView,
            self.__busyDialog
          );
          self.__busyDialog.open();
        },

        destroyBusyDialog: function () {
          var self = this;
          if (self.__busyDialog !== undefined) {
            self.__busyDialog.close();
            self.__busyDialog.destroy();
            self.__busyDialog = undefined;
          }
        },

        /* BUSY DIALOG END */

        setFilterEQWithKey: function (sKey, sValue) {
          return new sap.ui.model.Filter({
            path: sKey,
            operator: EQ,
            value1: sValue,
          });
        },

        _isOneValueEmpty: function (sValue1, sValue2) {
          if (
            (sValue1.getValue() !== null &&
              sValue1.getValue() !== "" &&
              (sValue2.getValue() === null || sValue2.getValue() === "")) ||
            (sValue2.getValue() !== null &&
              sValue2.getValue() !== "" &&
              (sValue1.getValue() === null || sValue1.getValue() === ""))
          )
            return true;
          else return false;
        },

        _setFilterEQValue: function (aFilters, sInput) {
          if (sInput && sInput.getValue()) {
            aFilters.push(
              new FILTER(
                sInput.data("searchPropertyModel"),
                EQ,
                sInput.getValue()
              )
            );
          }
        },

        _setFilterBTValue: function (aFilters, sInputFrom, sInputTo) {
          if (
            sInputFrom &&
            sInputFrom.getValue() &&
            sInputTo &&
            sInputTo.getValue()
          ) {
            aFilters.push(
              new FILTER(
                sInputFrom.data("searchPropertyModel"),
                BT,
                sInputFrom.getValue(),
                sInputTo.getValue()
              )
            );
          }
        },

        _setFilterEQKey: function (aFilters, sInput) {
          if (sInput && sInput.getSelectedKey()) {
            aFilters.push(
              new FILTER(
                sInput.data("searchPropertyModel"),
                EQ,
                sInput.getSelectedKey()
              )
            );
          }
        },

        /*FILTER*/

        getHeaderFilter: function () {
          var self = this,
            object = [],
            filters = [],
            oView = self.getView(),
            sGjahr = oView.byId("fGjahr"),
            sZammin = oView.byId("fZammin"),
            sZufficioliv1 = oView.byId("fZufficioliv1"),
            sZufficioliv2 = oView.byId("fZufficioliv2"),
            sZcoddecrFrom = oView.byId("fZcoddecrFrom"),
            sZcoddecrTo = oView.byId("fZcoddecrTo"),
            sZCodIpeFrom = oView.byId("fZCodIpeFrom"),
            sZCodIpeTo = oView.byId("fZCodIpeTo"),
            sFdatkFrom = oView.byId("fFdatkFrom"),
            sFdatkTo = oView.byId("fFdatkTo"),
            sZNumClaFrom = oView.byId("fZNumClaFrom"),
            sZNumClaTo = oView.byId("fZNumClaTo"),
            sZStatoCla = oView.byId("fZStatoCla");

          /*START Validation*/
          object.isValidate = true;

          /*Num Decree*/
          if (self._isOneValueEmpty(sZcoddecrFrom, sZcoddecrTo)) {
            object.isValidate = false;
            object.validationMessage = "msgZcoddecrRequiredBoth";
            return object;
          }

          /*Num Ipe*/
          if (self._isOneValueEmpty(sZCodIpeFrom, sZCodIpeTo)) {
            object.isValidate = false;
            object.validationMessage = "msgZCodIpeRequiredBoth";
            return object;
          }

          /*Expiry*/
          if (self._isOneValueEmpty(sFdatkFrom, sFdatkTo)) {
            object.isValidate = false;
            object.validationMessage = "msgFdatkRequiredBoth";
            return object;
          }

          /*Num Provision*/
          if (self._isOneValueEmpty(sZNumClaFrom, sZNumClaTo)) {
            object.isValidate = false;
            object.validationMessage = "msgZNumClaRequiredBoth";
            return object;
          }

          /*STOP Validation*/

          /*Fill Filters*/

          self._setFilterEQValue(filters, sGjahr);
          self._setFilterEQValue(filters, sZammin);
          self._setFilterEQValue(filters, sZufficioliv1);
          self._setFilterEQValue(filters, sZufficioliv2);
          self._setFilterBTValue(filters, sZcoddecrFrom, sZcoddecrTo);
          self._setFilterBTValue(filters, sZCodIpeFrom, sZCodIpeTo);
          self._setFilterBTValue(filters, sFdatkFrom, sFdatkTo);
          self._setFilterBTValue(filters, sZNumClaFrom, sZNumClaTo);
          if (sZStatoCla.getSelectedKey() !== "t")
            self._setFilterEQKey(filters, sZStatoCla);

          object.filters = filters;
          return object;
        },

        // PAGINATION

        getChangePage: function (sNameModel, maxPage) {
          var self = this,
            bFirst = false,
            bLast = false,
            paginatorModel = self.getModel(sNameModel),
            numRecordsForPage = paginatorModel.getProperty("/stepInputDefault"),
            currentPage = paginatorModel.getProperty("/currentPage");

          if (currentPage === 0) {
            return;
          }

          paginatorModel.setProperty(
            "/paginatorSkip",
            (currentPage - 1) * numRecordsForPage
          );

          if (currentPage === maxPage) {
            bFirst = true;
            bLast = false;
            if (currentPage === 1) {
              bFirst = false;
            }
          } else if (currentPage === 1) {
            bFirst = false;
            if (currentPage < maxPage) {
              bLast = true;
            }
          } else if (currentPage > maxPage) {
            bFirst = false;
            bLast = false;
          } else {
            if (currentPage > 1) {
              bFirst = true;
            }
            bLast = true;
          }
          paginatorModel.setProperty("/btnLastEnabled", bLast);
          paginatorModel.setProperty("/btnFirstEnabled", bFirst);
        },
        getLastPaginator: function (sNameModel) {
          var self = this,
            paginatorModel = self.getModel(sNameModel),
            numRecordsForPage = paginatorModel.getProperty("/stepInputDefault");

          paginatorModel.setProperty("/btnLastEnabled", false);
          paginatorModel.setProperty("/btnFirstEnabled", true);
          var paginatorClick = self.paginatorTotalPage;

          paginatorModel.setProperty("/paginatorClick", paginatorClick);
          paginatorModel.setProperty(
            "/paginatorSkip",
            (paginatorClick - 1) * numRecordsForPage
          );

          paginatorModel.setProperty(
            "/currentPage",
            self.paginatorTotalPage === 0 ? 1 : self.paginatorTotalPage
          );
        },
        getFirstPaginator: function (sNameModel) {
          var self = this,
            paginatorModel = self.getModel(sNameModel);

          paginatorModel.setProperty("/btnLastEnabled", true);
          paginatorModel.setProperty("/btnFirstEnabled", false);
          paginatorModel.setProperty("/paginatorClick", 0);
          paginatorModel.setProperty("/paginatorSkip", 0);
          paginatorModel.setProperty("/currentPage", 1);
        },
        resetPaginator: function (sNameModel) {
          var self = this,
            paginatorModel = self.getModel(sNameModel);
          paginatorModel.setProperty("/btnFirstEnabled", false);
          paginatorModel.setProperty("/btnNextEnabled", false);
          paginatorModel.setProperty("/btnLastEnabled", false);
          paginatorModel.setProperty("/recordForPageEnabled", false);
          paginatorModel.setProperty("/currentPageEnabled", true);
          paginatorModel.setProperty("/currentPage", 1);
          paginatorModel.setProperty("/maxPage", 1);
          paginatorModel.setProperty("/paginatorClick", 0);
          paginatorModel.setProperty("/paginatorSkip", 0);
        },
      }
    );
  }
);
