var tasks = {};

$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function (event) {
    console.log("activate", this);
    $(this).addClass("dropover")
    $(".bottom-trash").addClass("bottom-trash-drag")
  },
  deactivate: function (event) {
    console.log("deactivate", this);
    $(this).removeClass("dropover")
    $(".bottom-trash").removeClass("bottom-trash-drag")
  },
  over: function (event) {
    console.log("over", event.target);
    $(event.target).addClass("dropover-active")
    
  },
  out: function (event) {
    console.log("out", event.target);
    $(event.target).removeClass("dropover-active")
  },
  update: function (event) {
    var tempArr = [];
    // trim down list's ID to match object property
    var arrName = $(this).attr("id").replace("list-", "");
    // update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
    // Loop over current set of children in sortable list
    $(this)
      .children()
      .each(function () {
        var text = $(this).find("p").text().trim();
        var date = $(this).find("span").text().trim();
        tempArr.push({
          text: text,
          date: date,
        });
      });
    console.log(tempArr);
    console.log(tasks);
  },
});

$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    console.log("drop");
    ui.draggable.remove();
    $(".bottom-trash").removeClass("bottom-trash-active")
  },
  over: function(event, ui) {
    console.log("over");
    $(".bottom-trash").addClass("bottom-trash-active")
  },
  out: function(event, ui) {
    console.log("out");
    $(".bottom-trash").removeClass("bottom-trash-active")
  }
});

$("#modalDueDate").datepicker({
  showOn: "both",
  minDate: 1,
  maxDate: 30,
});

var createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  
  var taskSpan = $("<span>")
    .addClass("badge badge-save badge-pill")
    .text(taskDate);
  var taskP = $("<p>").addClass("m-1").text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  //check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: [],
    };
  }

  // loop over object properties
  $.each(tasks, function (item, index) {
    // then loop over sub-array
    index.forEach(function (task) {
      createTask(task.text, task.date, item);
    });
  });
};

var saveTasks = function () {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// Event delegation to dynamically add <textarea>
$(".list-group").on("click", "p", function () {
  var text = $(this).text().trim();
  var textInput = $("<textarea>").addClass("form-control").val(text);
  $(this).replaceWith(textInput);
  textInput.trigger("focus");
});

// Event delegation To save data points after an Edit
$(".list-group").on("click", "textarea", function () {
  //console.log(this);
  //get the textareas current value
  var text = $(this).val().trim();
  //get the parent ul's ID attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");
  //console.log(status);
  //get the tasks position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();
  //console.log(index);
  tasks[status][index].text = text;
  saveTasks();

  // recreate p element
  var taskP = $("<p>").addClass("m-1").text(text);
  // replace textarea with p element
  $(this).replaceWith(taskP);
});

// Event to adjust Date Input
$(".list-group").on("click", "span", function () {
  //console.log(this);
  // Get current value of span
  var date = $(this).text().trim();
  // Create new input value
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

    $(this).replaceWith(dateInput);

    dateInput.datepicker({
      //showOn: "both",
      minDate: -5,
      //maxDate: 30,
      onClose: function(){
        $(this).trigger("change");
      }
    }); 
  //console.log(dateInput);
 
  dateInput.trigger("focus");

});

// Event to soldify after editing the date
$(".list-group").on("change", "input[type='text']", function () {
  //console.log(this);
  //Get current text
  var date = $(this).val().trim();
  //Get the parent ul's id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");
  //console.log(status);
  //Get the task's position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();
  //Update task in array and re-save to local storage
  tasks[status][index].date = date;
  saveTasks();
  //Recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-save badge-pill")
    .text(date);
  //Replace input with span element
  $(this).replaceWith(taskSpan);
  // Pass task's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
});

// audit task to create coloring enhancements
var auditTask = function(taskEl) {
  // get data from task element
  var date = $(taskEl).find("span").text().trim();
  // convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17);
  // remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");
  // apply new class if task is near/over due date
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
    console.log('hello');
  }
  else if (Math.abs(moment().diff(time, "days"))<= 2) {
    $(taskEl).addClass("list-group-item-warning");
    console.log("baddie");
  }
}

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function () {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate,
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();

setInterval(function() {
  $(".card .list-group-item").each(function(item, index) {
  auditTask(index);
  });
}, (1000 * 60) * 30);
