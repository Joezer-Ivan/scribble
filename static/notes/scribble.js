let isAutoSaveEventLinedUp = false;
let autoSave = localStorage.getItem("autoSave") === "true";

$(document).ready(function(){
    $("#new-note").click(function(){
        newNote();
    });
    $("#autosave-switch").click(function(){
        toggleAutoSave(this);
    });
    if(autoSave === true){
        $("#autosave-switch").addClass("fa-toggle-on");
    }else{
        $("#autosave-switch").addClass("fa-toggle-off");
    }

    getNotes();
});

function toggleAutoSave(toggleSwitch){
    $(toggleSwitch).toggleClass('fa-toggle-off fa-toggle-on');
    if(autoSave === true){
        localStorage.setItem("autoSave","false");
        autoSave = false;
        showAlert("Auto save has been disabled","success");
    }else{
        localStorage.setItem("autoSave", "true");
        autoSave = true;
        showAlert("Auto save has been enabled","success");
    }
}

function getNotes(){
    $.ajax({
        url:"notes/"

    }).done(function(notes){
        for(let note of notes){
            populateNote(note);
        }
    });
}

function populateNote(note){
    note.body = note.body.replace(/\n/g, "<br>");
    $("#note-template")
        .find(".note").attr("data-noteId", note.id).end()
        .find("#note-title-id").text(note.title).end()
        .find(".note-body").html(note.body).end()
        .find(".note-update-time").text(note.created_on).end();

    $(".notes-container").prepend($("#note-template").html());
    $('[data-noteId="'+note.id+'"]').find("#note-enlarge").click(function(){
        enlargedView(note.id);
        changeMode("view");
    });
}

function deleteNote(noteId){
    $.ajax({
        url:"notes/"+noteId+"/",
        method: "DELETE"
    }).done(function(data){
        $('[data-noteId="'+noteId+'"]').eq(0).remove();
        showAlert("Note has been deleted","success");
        closeEnlargedView();
    }).fail(function(){
        showAlert("Oh snap! Something went wrong :/","failure");
    });
}

function enlargedView(noteId){
    $("#overlay").show();
    $(document).keyup(function(e) {
         if (e.keyCode == 27) {
            closeEnlargedView();
        }
    });
    if(noteId){
        let noteToEnlarge = $('[data-noteId="'+noteId+'"]').eq(0);
        let title = noteToEnlarge.find("#note-title-id").text(),
            body = noteToEnlarge.find(".note-body").html(),
            update_time = noteToEnlarge.find(".note-update-time").text();

        $("#enlarged-title").text(title);
        $("#enlarged-body").html(body);
        $("#enlarged-note > .note-update-time").text(update_time);
        $("#edited-note-id").val(noteId);

        $("#note-revisions").off('click').click(function(){
            getRevisions(noteId);
        });
        $("#note-delete").off('click').click(function(){
            deleteNote(noteId);
        });
        $("#note-close").off('click').click(function(){
            closeEnlargedView(noteId);
        });
        $("#note-edit").off('click').click(function(){
            changeMode("edit");
        });
        $("#note-discard").off('click').click(function(){
            changeMode("view");
        });
        $("#note-save").off('click').click(function(){
            saveNote(false);
        });
    }else{
        $("#note-discard").off('click').click(function(){
            closeEnlargedView();
        });
        $("#note-save").off('click').click(function(){
            saveNote(false);
        });
        $("#edited-note-id").val("");
    }
}

function closeEnlargedView() {
    $("#overlay").hide();
    if(autoSaveEvent){
        clearTimeout(autoSaveEvent);
    }
}

function getRevisions(noteId){
    if($("#revisions").css("display") === "none"){
        $.ajax({
            url:"notes/"+noteId+"/history/"
        }).done(function(history){
            $("#revisions").find("ul").empty();
            for(let item of history){
                if(history.length > 0){
                    let link = `<li><a href='javascript:void(0);' onclick='getRevision(${item.id})'>${item.created_on}</a></li>`
                    $("#revisions").find("ul").prepend(link);
                }else{
                    $("#revisions").text("No changes have been made to this note.");
                }
            }
            let link = `<li><a href='javascript:void(0);' onclick='getRevision(${noteId},true)'>Current Version</a></li>`
            $("#revisions").find("ul").prepend(link);
        });
        $("#revisions").show();
    }else{
        $("#revisions").hide();
    }
}

function getRevision(revisionId,current){
    let url = "notes/history/"+revisionId+"/";
    if(current){
        url = "notes/"+revisionId+"/";
    }
    $.ajax({
        url:url
    }).done(function(noteDetails){
        $("#enlarged-title").text(noteDetails.title);
        $("#enlarged-body").html(noteDetails.body.replace(/\n/g,'<br>'));
    });
}

function changeMode(mode){
    if(mode === "edit"){
        let title = $("#enlarged-title").text();
        let body = $("#enlarged-body").html().replace(/<br>/g,"\n");

        $("#enlarged-note").hide();
        $("#enlarged-note-edit").show();
        $("#title-edit").val(title);
        $("#body-edit").val(body);
        autoSaveFn();
    }else if(mode === "view"){
        $("#enlarged-note-edit").hide();
        $("#enlarged-note").show();
        $("#revisions").hide();
        if(autoSaveEvent){
            //to stop auto save when we're not in the edit mode
            clearTimeout(autoSaveEvent);
        }
    }else if(mode === "new"){
        $("#enlarged-note").hide();
        $("#enlarged-note-edit").show();
        $("#title-edit").val("");
        $("#body-edit").val("");
        autoSaveFn();
    }
}

function autoSaveFn(){
    if(autoSave && ($("#enlarged-note-edit").css("display")==='block')){
        $("#title-edit, #body-edit").off('keyup').keyup(function(e){
            if(!isAutoSaveEventLinedUp){
                isAutoSaveEventLinedUp = true;
                autoSaveEvent = setTimeout(function(){
                    saveNote(true);
                    isAutoSaveEventLinedUp = false;
                },30000);
            }
        });
    }
}

function newNote(){
    enlargedView();
    changeMode("new");
}

function showAlert(message,type){
    if(type === "success"){
        $(".success-alert").text(message).show();
        setTimeout(function(){
            $(".success-alert").hide();
        },3000);
    }else if(type === "failure"){
        $(".failure-alert").text(message).show();
        setTimeout(function(){
            $(".failure-alert").hide();
        },3000);
    }
}

function saveNote(isAutoSave){
    let title = $("#title-edit").val();
    let body = $("#body-edit").val();
    let noteData = {
        "title":title,
        "body":body
    };
    noteId = $('#edited-note-id').val();
    if(noteId){
        $.ajax({
            url:"notes/"+noteId+"/",
            method: "PUT",
            data: noteData
        }).done(function(data){
            $('[data-noteId="'+noteId+'"]').eq(0)
                .find("#note-title-id").text(data.title).end()
                .find(".note-body").html(data.body).end()
                .find(".note-update-time").text(data.created_on).end();
            
            $("#enlarged-title").text(data.title);
            $("#enlarged-body").html(data.body.replace(/\n/g, '<br>'));
            showAlert("Note saved successfully","success");
            if(!isAutoSave){
                changeMode("view");
            }
        }).fail(function(){
            showAlert("Oh snap! Something went wrong :/","failure");
        });
    }else{
        $.ajax({
            url:"notes/",
            method: "POST",
            data: noteData
        }).done(function(data){
            populateNote(data);
            $("#edited-note-id").val(data.id);
            showAlert("Note added successfully","success");
            if(!isAutoSave){
                closeEnlargedView();
            }
        }).fail(function(){
            showAlert("Oh snap! Something went wrong :/","failure");
        });
    }
}
