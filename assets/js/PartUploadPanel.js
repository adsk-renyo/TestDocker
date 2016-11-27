/**
Requires: jquery.fileupload.js, jquery.iframe-transport.js, jquery.knob.js, jquery,ui.widget.js, mini_fileupload.cs

Example:
    var ModelUploader = function(){};
    ModelUploader.prototype.onFileAdded =  function(panel, fileData) {
        // Do something
        panel.submit(fileData);
    }
    ModelUploader.prototype.onUploadFinished =  function(panel, fileData) {
        // Do something
    }
    ModelUploader.prototype.onUploadfailed =  function(panel, fileData) {
        // Do something
    }
    var panel = new PartUploadPanel('#upload ul', '#drop a', '#drop', '#upload', new ModelUploader());
*/

var PartUploadPanel = function (ulDomName, dropAnchorDomName, dropDomName, uploadDomName, modelUploader) {
    var self = this;
    self.ulDomName = ulDomName;
    self.dropAnchorDomName = dropAnchorDomName;
    self.dropDomName = dropDomName;
    self.uploadDomName = uploadDomName;

    $(self.dropAnchorDomName).click(function () {
        // Simulate a click on the file input button
        // to show the file browser dialog
        $(this).parent().find('input').click();
    });

    $(self.uploadDomName).fileupload({
        dropZone: $(self.dropDomName),
        add: function (e, data) {
            modelUploader.onFileAdded(self, data);
        },

        progress: function (e, data) {
            // Calculate the completion percentage of the upload
            var progress = parseInt(data.loaded / data.total * 100, 10);

            // Update the hidden input field and trigger a change
            // so that the jQuery knob plugin knows to update the dial
            data.context.find('input').val(progress).change();

            if (progress == 100) {
                data.context.removeClass('working');
            }
        },

        fail: function (e, data) {
            // Something has gone wrong!
            data.context.addClass('error');
            modelUploader.onUploadFailed(self, data);
        }
    });

    // Prevent the default action when a file is dropped on the window
    $(document).on('drop dragover', function (e) {
        e.preventDefault();
    });


    this.formatFileSize = function (bytes) {
        if (typeof bytes !== 'number') {
            return '';
        }

        if (bytes >= 1000000000) {
            return (bytes / 1000000000).toFixed(2) + ' GB';
        }

        if (bytes >= 1000000) {
            return (bytes / 1000000).toFixed(2) + ' MB';
        }

        return (bytes / 1000).toFixed(2) + ' KB';
    };

    this.submit = function (data) {
        var tpl = $('<li class="working"><input type="text" value="0" data-width="48" data-height="48"' +
            ' data-fgColor="#0788a5" data-readOnly="1" data-bgColor="#3e4043" /><p></p><span></span></li>');

        // Append the file name and file size
        tpl.find('p').text(data.files[0].name)
                     .append('<i>' + self.formatFileSize(data.files[0].size) + '</i>');

        // Add the HTML to the UL element
        data.context = tpl.appendTo($(self.ulDomName));

        // Initialize the knob plugin
        tpl.find('input').knob();

        // Listen for clicks on the cancel icon
        tpl.find('span').click(function () {

            if (tpl.hasClass('working')) {
                jqXHR.abort();
            }

            tpl.fadeOut(function () {
                tpl.remove();
            });

        });

        // Automatically upload the file once it is added to the queue
        var jqXHR = data.submit();
        jqXHR.done(function (response) {
            modelUploader.onUploadFinished(response);
        });
    }
};

