sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  (Controller, Fragment, MessageToast, MessageBox, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("fiori.research.jihan.controller.BookList", {
      // Holds the dialog instance so we load it only once
      _oAuthorDialog: null,

      // Holds the book dialog instance (Add or Edit) so we load it only once
      _oBookDialog: null,

      // Stores the selected author’s binding context when editing
      _oEditContext: null,
      
      
      // Stores the the selected author’s ID
      _sSelectedAuthorId: null,


      // Lifecycle hook—useful for initialization if needed
      onInit() {},

      // Lifecycle hook—could initialize additional logic if needed
      onInit() {},

      // Handler for the "Add Author" button: lazy-loads the fragment and opens the dialog
      onAddAuthor: async function () {
        if (!this._oAuthorDialog) {
          this._oAuthorDialog = await Fragment.load({
            id: this.getView().getId(),
            name: "fiori.research.jihan.view.AddAuthorDialog",
            controller: this,
          });
        }
        this._oAuthorDialog.open();
      },

      // Handler for the dialog’s "Cancel" button: cleanly close and destroy the fragment
      onDialogCancel: function () {
        this._closeAndDestroyDialog();
      },


      // Handler for the dialog’s "Create" button:
      // - Reads user inputs
      // - Sends an OData CREATE request
      // - Shows success or error feedback
      // - Closes the dialog and refreshes the list
      onAddAuthorConfirm: async function () {
        const oModel = this.getView().getModel();
        const sViewId = this.getView().getId();
        const sName = Fragment.byId(sViewId, "addNameInput").getValue().trim();
        const sBio = Fragment.byId(sViewId, "addBioInput").getValue().trim();
        const bodyData = { name: sName, bio: sBio };

        try {
          // Bind to /Authors and issue CREATE; wait for completion
          const oListBinding = oModel.bindList("/Authors");
          await oListBinding.create(bodyData).created();
          MessageToast.show("Author created");
        } catch (error) {
          // Show an error dialog if the request fails
          MessageBox.error(error.message);
        }

        this._closeAndDestroyDialog();
        this._refreshAuthorList();
      },

             /**
       * onEditAuthor
       * Ensures exactly one author is selected, saves its context,
       * pre-fills the Edit dialog inputs, and opens the dialog.
       */
      onEditAuthor: async function () {
        const oList = this.byId("authorList");
        const aContexts = oList.getSelectedContexts();

        if (aContexts.length !== 1) {
          MessageToast.show("Please select one author to edit.");
          return;
        }

        // Keep the selected context for the update call
        this._oEditContext = aContexts[0];
        const oData = this._oEditContext.getObject();

        // Load the Edit fragment if not already loaded
        if (!this._oAuthorDialog) {
          this._oAuthorDialog = await Fragment.load({
            id: this.getView().getId(),
            name: "fiori.research.jihan.view.EditAuthorDialog",
            controller: this,
          });
        }

        // Prefill dialog fields with the selected author’s current data
        const sFragId = this.getView().getId();
        Fragment.byId(sFragId, "editNameInput").setValue(oData.name);
        Fragment.byId(sFragId, "editBioInput").setValue(oData.bio);

        this._oAuthorDialog.open();
      },

      /**
       * onEditAuthorConfirm
       * Reads updated values, updates the bound context properties,
       * submits the OData update batch, shows feedback,
       * then closes the dialog and refreshes the list.
       */
      onEditAuthorConfirm: async function () {
        const sFragId = this.getView().getId();
        const oModel = this.getView().getModel();
        const sName = Fragment.byId(sFragId, "editNameInput").getValue().trim();
        const sBio = Fragment.byId(sFragId, "editBioInput").getValue().trim();
        const oContext = this._oEditContext; // previously stored binding context

        try {
          // Update the properties in the context
          await oContext.setProperty("name", sName);
          await oContext.setProperty("bio", sBio);
          MessageToast.show("Author updated");
        } catch (error) {
          MessageBox.error(error.message);
        }

        this._closeAndDestroyDialog();
        this._refreshAuthorList();
      },
      // Closes and destroys the dialog fragment to free resources
      _closeAndDestroyDialog: function () {
        this._oAuthorDialog.close();
        this._oAuthorDialog.destroy();
        this._oAuthorDialog = null;
      },

    onDeleteBook() {
            const oTable = this.byId("booksTable");
            const aSelectedContexts = oTable.getSelectedContexts();
            // const authorId = aSelectedContexts[0].getObject().author_ID;
            if (aSelectedContexts.length === 0) {
                MessageToast.show("No books selected for deletion.");
                return;
            }
            MessageBox.confirm(`Delete ${aSelectedContexts.length} selected book(s)?`, {
                onClose: async (sAction) => {
                    if (sAction === "OK") {
                        try {
                            for (const context of aSelectedContexts) {
                            // const context = aSelectedContexts[0];
                                // await context.setProperty("author_ID", authorId) // Mark as deleted
                                await context.setProperty("isDeleted", true); // Mark as deleted
                            }
                            MessageToast.show("Books deleted successfully.");
                            oTable.getBinding("items").refresh(); // Refresh the list
                        } catch (e) {
                            console.error("Error deleting books:", e);
                            MessageToast.show("Error deleting books.");
                        }
                    }
                }
            });
        },
      onDeleteAuthor: function () {

  // Get reference to the authors list control
  const oList = this.byId("authorList");

  // Retrieve all selected contexts (binding contexts) from the list
  const aContexts = oList.getSelectedContexts();
  // We only care about the first selected context
  const oContext = aContexts[0];

  // Ensure exactly one author is selected before proceeding
  if (aContexts.length !== 1) {
    MessageToast.show("Please select one author to delete.");
    return;
  }

  // Show a confirmation dialog before hard-deleting the record
  MessageBox.confirm("Are you sure you want to delete this author?", {
    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
    onClose: async function (sAction) {
      // If the user cancels, do nothing
      if (sAction !== MessageBox.Action.OK) {
        return;
      }

      try {
        // Perform the OData V4 delete operation on the selected context
        // Change it to _performSoftDelete or _perfromHardDelete
        this._performSoftDelete(oContext);
        MessageToast.show("Author deleted successfully.");

        // Refresh the list so the deleted entry is removed from the UI
        this._refreshAuthorList();
      } catch (error) {
        // Show an error dialog if the delete request fails
        MessageBox.error(error.message);
      }
    }.bind(this)  // Bind the handler so we can access `this._refreshAuthorList()`
  });
},

      /**
       * Marks the given entity as deleted without removing it from the backend.
       * This “soft delete” simply sets the isDeleted flag to true,
       * allowing us to filter out or archive records without losing history.
       */
      _performSoftDelete: async function (oContext) {
        await oContext.setProperty("isDeleted", true);
      },

      /**
       * Permanently removes the given entity from the backend.
       * This “hard delete” issues an OData DELETE request on the context,
       * eliminating the record entirely.
       */
      _performHardDelete: async function (oContext) {
        await oContext.delete();
      },

              onAuthorSelect: function () {
            // Get the reference to the author list control by its ID
            const oList = this.byId("authorList");

            // Get the currently selected item (author) from the list
            const oAuthorSelected = oList.getSelectedItem();

            // If no author is selected, exit the function
            if (!oAuthorSelected) {
              return;
            }

            // Retrieve the ID of the selected author from its binding context
            const sAuthorId = oAuthorSelected.getBindingContext().getProperty("ID");
            this._sSelectedAuthorId = sAuthorId;

            // Call a private function to bind and display books related to the selected author
            this._bindBooks(sAuthorId);
      },

              _bindBooks: function (sAuthorID) {
            // Get a reference to the books table control by its ID
            const oTable = this.byId("booksTable");
            
            // If no author ID is provided, unbind the table and exit
            if (!sAuthorID) {
              oTable.unbindItems();
              return;
            }

            // Bind the table items to the /Books entity set, filtered by the selected author's ID
            oTable.bindItems({
              path: "/Books", // OData entity set
              filters: [new Filter("author_ID", FilterOperator.EQ, sAuthorID),
                    new Filter("isDeleted", FilterOperator.EQ, false)
              ], // Show only books matching the selected author
              template: new sap.m.ColumnListItem({
                cells: [
                    // Display the book title
                    new sap.m.Text({ text: "{title}" }),
                    // Display the book description
                    new sap.m.Text({ text: "{descr}" }),
                    // Display the stock as a number
                    new sap.m.ObjectNumber({ number: "{stock}" }),
                    // Display the price along with its currency code
                    new sap.m.ObjectNumber({
                        number: "{price}",
                        unit: "{currency_code}",
                    }),
                ],
              }),
            });
        },

        // Opens the “Add Book” dialog, loading it lazily the first time
      onAddBook: async function () {
        if (!this._oBookDialog) {
          this._oBookDialog = await Fragment.load({
            id: this.getView().getId(),
            name: "fiori.research.jihan.view.AddBookDialog",
            controller: this,
          });
        }
        this._oBookDialog.open();
      },
      
       // Reads input values, sends an OData CREATE for /Books, then refreshes the table
      onAddBookConfirm: async function () {
        const oModel = this.getView().getModel();
        const sFragId = this.getView().getId();

        // Retrieve and normalize input values
        const sTitle = Fragment.byId(sFragId, "addTitleInput")
          .getValue()
          .trim();
        const sDescr = Fragment.byId(sFragId, "addDescrInput")
          .getValue()
          .trim();
        let iStock = parseInt(
          Fragment.byId(sFragId, "addStockInput").getValue().trim(),
          10
        );
        const fPrice = Fragment.byId(sFragId, "addPriceInput")
          .getValue()
          .trim();
        const sCurrency = Fragment.byId(sFragId, "addCurrencyInput")
          .getValue()
          .trim()
          .toUpperCase();
        const sAuthorId = this._sSelectedAuthorId; // selected author’s key

        // Build payload for the CREATE request
        const bodyData = {
          author_ID: sAuthorId,
          title: sTitle,
          descr: sDescr,
          stock: iStock,
          price: fPrice,
          currency: { code: sCurrency },
        };

        try {
          // Issue CREATE against /Books and await confirmation
          const oListBinding = oModel.bindList("/Books");
          await oListBinding.create(bodyData).created();
          MessageToast.show("Book created");
          this._closeAndDestroyDialog();
          this._refreshBooks();
        } catch (error) {
          // Display error if the request fails
          MessageBox.error(error.message);
        }
      },

            // Handler for the “Edit Book” action:
      // • Ensures exactly one book is selected
      // • Stores its binding context for later update
      // • Lazy-loads the EditBookDialog fragment
      // • Prefills all input fields with the current book data
      // • Opens the dialog
      onEditBook: async function () {
        const oList = this.byId("booksTable");
        const aContexts = oList.getSelectedContexts();

        // Require one and only one selection
        if (aContexts.length !== 1) {
          MessageToast.show("Please select one book to edit.");
          return;
        }

        // Save the selected context for onEditBookConfirm
        this._oEditContext = aContexts[0];
        const oData = this._oEditContext.getObject();

        // Load the EditBookDialog fragment if not already loaded
        if (!this._oBookDialog) {
          this._oBookDialog = await Fragment.load({
            id: this.getView().getId(),
            name: "fiori.research.jihan.view.EditBookDialog",
            controller: this,
          });
          // Ensure the dialog is destroyed when the view is destroyed
          this.getView().addDependent(this._oBookDialog);
        }

        const sFragId = this.getView().getId();
        // Prefill the dialog inputs with the book’s existing values
        Fragment.byId(sFragId, "editTitleInput").setValue(oData.title);
        Fragment.byId(sFragId, "editDescrInput").setValue(oData.descr);
        Fragment.byId(sFragId, "editStockInput").setValue(oData.stock);
        Fragment.byId(sFragId, "editPriceInput").setValue(oData.price);
        Fragment.byId(sFragId, "editCurrencyInput").setValue(
          oData.currency_code
        );

        this._oBookDialog.open();
      },

      // Handler for the EditBookDialog’s “Save” button:
      // • Reads updated field values
      // • Updates properties in the stored binding context
      // • Submits a batch update to the OData service
      // • Shows a success toast or an error dialog
      // • Closes the dialog and refreshes the books table
      onEditBookConfirm: async function () {
        const oModel = this.getView().getModel();
        const sFragId = this.getView().getId();

        // Read and normalize updated values from the dialog
        const sTitle = Fragment.byId(sFragId, "editTitleInput")
          .getValue()
          .trim();
        const sDescr = Fragment.byId(sFragId, "editDescrInput")
          .getValue()
          .trim();
        let iStock = parseInt(
          Fragment.byId(sFragId, "editStockInput").getValue().trim(),
          10
        );
        const fPrice = Fragment.byId(sFragId, "editPriceInput")
          .getValue()
          .trim();
        const sCurrency = Fragment.byId(sFragId, "editCurrencyInput")
          .getValue()
          .trim()
          .toUpperCase();

        try {
          const oContext = this._oEditContext;
          // Apply each updated property to the binding context
          await oContext.setProperty("title", sTitle);
          await oContext.setProperty("descr", sDescr);
          await oContext.setProperty("stock", iStock);
          await oContext.setProperty("price", fPrice);
          await oContext.setProperty("currency_code", sCurrency);

          MessageToast.show("Book updated");
          this._closeAndDestroyDialog();
          this._refreshBooks();
        } catch (error) {
          MessageBox.error(error.message);
        }
      },

      onDeleteBook: function () {
                const oList = this.byId("booksTable");
                const aContexts = oList.getSelectedContexts();

                if (aContexts.length !== 1) {
                  MessageToast.show("Please select one book to delete.");
                  return;
                }

                // Confirm with the user
                MessageBox.confirm("Are you sure you want to delete this book?", {
                  actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                  onClose: async function (sAction) {
                    if (sAction !== MessageBox.Action.OK) {
                      return;
                    }

                    try {
                      const oContext = aContexts[0];

                      // Perform the delete on the context
                      this._performSoftDelete(oContext);
                      // this._performHardDelete(oContext);

                      MessageToast.show("Book deleted successfully.");

                      // Refresh the list & clear books table
                      this._bindBooks(this._sSelectedAuthorId);
                    } catch (oError) {
                      MessageToast.show(
                        "Error deleting book: " + (oError.message || oError)
                      );
                    }
                  }.bind(this),
                });
              },

      // Refreshes the books table so new entries appear immediately
      _refreshBooks: function () {
        const oTable = this.byId("booksTable");
        const oBinding = oTable.getBinding("items");
        if (oBinding) {
          oBinding.refresh();
        }
      },

      /**
       * _closeAndDestroyDialog
       * Closes and destroys the dialog fragment to release memory.
       */
      _closeAndDestroyDialog: function () {
        // Close and destroy author dialog
        if (this._oAuthorDialog) {
          this._oAuthorDialog.close();
          this._oAuthorDialog.destroy();
          this._oAuthorDialog = null;
        }
        
        // Close and destroy book dialog
        if (this._oBookDialog) {
          this._oBookDialog.close();
          this._oBookDialog.destroy();
          this._oBookDialog = null;
        }
      },
    });
  }
);
