sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";
    return Controller.extend("fiori.aichat.controller.TaskList", {
        onInit: function () {
            // Initialize controller
        },
        onSubmitQuery: function() {
            var oInput = this.byId("chatInput");
            var sMessage = oInput.getValue().trim();
            if (sMessage) {
                // Add user message
                this.addChatMessage(sMessage, "user");
                // Clear input
                oInput.setValue("");
                // Simulate AI response (replace with your actual AI call)
                setTimeout(() => {
                    this.addChatMessage(sMessage + " hehehe", "ai");
                }, 1000);
            }
        },
        addChatMessage: function(sMessage, sType) {
            var oChatBox = this.byId("chatMessagesBox");
            var sTimestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            var oHTML = new sap.ui.core.HTML({
                content: `
                    <div class="chatBubbleContainer ${sType}">
                        <div class="chatBubble ${sType}">
                            <div>${sMessage}</div>
                            <div class="chatTimestamp">${sTimestamp}</div>
                        </div>
                    </div>
                `
            });
            oChatBox.addItem(oHTML);
            // Scroll to bottom
            setTimeout(() => {
                var oScrollContainer = this.byId("chatMessagesContainer");
                if (oScrollContainer && oScrollContainer.getDomRef("scroll")) {
                    oScrollContainer.scrollTo(0, oScrollContainer.getDomRef("scroll").scrollHeight);
                }
            }, 100);
        }
    });
});