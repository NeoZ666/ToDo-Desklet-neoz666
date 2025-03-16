const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const Settings = imports.ui.settings;

function MyDesklet(metadata, desklet_id) {
    this._init(metadata, desklet_id);
}

MyDesklet.prototype = {
    __proto__: Desklet.Desklet.prototype,

    _init: function (metadata, desklet_id) {
        Desklet.Desklet.prototype._init.call(this, metadata, desklet_id);
        this.settings = new Settings.DeskletSettings(this, this.metadata.uuid, desklet_id);

        // Bind settings
        this.settings.bindProperty(Settings.BindingDirection.IN, "default_priority", "defaultPriority", this._onSettingsChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "show_completed_tasks", "showCompletedTasks", this._onSettingsChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "font_size", "fontSize", this._onSettingsChanged, null);

        log("Default Priority: " + this.defaultPriority);
        log("Show Completed Tasks: " + this.showCompletedTasks);
        log("Font Size: " + this.fontSize);

        this.tasks = [];
        this._createLayout();
        this._onSettingsChanged();
    },

    _createLayout: function () {
        // Main container
        this.mainBox = new St.BoxLayout({ vertical: true, style_class: 'main-box' });

        // Task list
        this.taskList = new St.BoxLayout({ vertical: true, style_class: 'task-list' });
        this.mainBox.add(this.taskList);

        // Input box
        this.inputBox = new St.BoxLayout({ style_class: 'input-box' });
        this.taskEntry = new St.Entry({ hint_text: 'New Task...' });
        this.inputBox.add(this.taskEntry, { expand: true });

        // Priority button
        this.priorityButton = new St.Button({ label: this.defaultPriority, style_class: 'priority-button' });
        this._createPriorityMenu();
        this.inputBox.add(this.priorityButton);

        // Add button
        this.addButton = new St.Button({ label: 'Add', style_class: 'add-button' });
        this.addButton.connect('clicked', () => {
            this._addTask(this.taskEntry.get_text(), this.priorityButton.label);
        });
        this.inputBox.add(this.addButton);

        this.mainBox.add(this.inputBox);
        this.setContent(this.mainBox);
    },

    _createPriorityMenu: function () {
        this.priorityMenu = new PopupMenu.PopupMenu(this.priorityButton, 0.0, St.Side.TOP);
        Main.uiGroup.add_actor(this.priorityMenu.actor);
        this.priorityMenu.actor.hide();

        let priorities = ["High", "Medium", "Low"];
        priorities.forEach((prio) => {
            let item = new PopupMenu.PopupMenuItem(prio);
            this.priorityMenu.addMenuItem(item);
        });

        this.priorityMenu.connect('activate', (menu, item) => {
            this.priorityButton.set_label(item.label.text);
            this.priorityMenu.toggle();
        });

        this.priorityButton.connect('button-press-event', () => {
            this.priorityMenu.toggle();
        });
    },

    _addTask: function (text, priority) {
        if (text.trim() === "") return;
        this.tasks.push({ text: text.trim(), priority: priority, completed: false });
        this._refreshTaskList();
        this.taskEntry.set_text("");
    },

    _refreshTaskList: function () {
        this.taskList.destroy_all_children();
        this.tasks.forEach((task, index) => {
            if (!this.showCompletedTasks && task.completed) return;

            let taskBox = new St.BoxLayout({ style_class: 'task-box' });
            let taskLabel = new St.Label({
                text: (index + 1) + ". " + task.text,
                style_class: 'task-label ' + task.priority.toLowerCase() + '-priority'
            });
            taskLabel.set_style(`font-size: ${this.fontSize}pt;`);
            if (task.completed) {
                taskLabel.add_style_class_name('completed');
            }

            let completeButton = new St.Button({
                label: task.completed ? "Undo" : "Complete",
                style_class: 'complete-button'
            });

            // Add taskLabel and completeButton to taskBox
            taskBox.add(taskLabel);
            taskBox.add(completeButton);

            // Add taskBox to taskList
            this.taskList.add(taskBox);
        });
    },

    _onSettingsChanged: function () {
        // Handle settings changes
        this._refreshTaskList();
    }
};

function main(metadata, desklet_id) {
    return new MyDesklet(metadata, desklet_id);
}