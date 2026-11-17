function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var fileUrl = "لا يوجد إيصال (أو دفع عند الاستلام)";
    
    if (payload.receiptBase64 && payload.receiptName) {
      var folderName = "Receipts_AlTahouna";
      var folders = DriveApp.getFoldersByName(folderName);
      var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      
      var contentType = payload.receiptMimeType || "image/jpeg";
      var bytes = Utilities.base64Decode(payload.receiptBase64);
      var blob = Utilities.newBlob(bytes, contentType, payload.orderId + "_" + payload.receiptName);
      
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = file.getUrl();
    }
    
    var orderSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
    if (orderSheet) {
      orderSheet.appendRow([
        new Date().toLocaleString("ar-EG"),
        payload.orderId,
        payload.customerName,
        payload.customerPhone,
        payload.deliveryZone,
        payload.customerAddress,
        payload.locationUrl || "لم يتم تحديد GPS",
        payload.itemsSummary,
        payload.subtotalPrice + " ج.م",
        payload.deliveryFee + " ج.م",
        payload.totalPrice + " ج.م",
        payload.paymentMethod,
        fileUrl
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", receiptUrl: fileUrl }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
