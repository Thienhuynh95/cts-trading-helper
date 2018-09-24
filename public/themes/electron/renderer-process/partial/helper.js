let helper = {
    status_html : (...params)=>{
        let [user_key_id, status] = params;
        let ignore = ['restore'];

        templateButton = {
            'info' : ["View Info", "fa-info", "btn-success"],
            'reply' : ["Reply", "fa-reply", "btn-info"],
            'trash' : ["Trash", "fa-trash", "btn-warning"],
            'restore' : ["Restore", "fa-undo", "btn-info"],
            'delete' : ["Delete", "fa-remove", "btn-danger delete"],
            'active' : ["Active", "fa-check", "btn-info"],
            'inactive' : ["Inactive", "fa-circle-o", "btn-danger"],
            'edit' : ["Edit", "fa-pencil", "btn-success edit"],
            'block' : ["Block", "fa-lock", "btn-info"],
            'unblock' : ["Unblock", "fa-unlock", "btn-warning"],
            'finish' : ["Finished", "fa-check", "btn-default finish"],
            'cancel' : ["Canceled", "fa-remove", "btn-default cancel"],
            'maintenance' : ["Maintenance", "fa-wrench", "btn-warning"],
            'unmaintenance' : ["Unmaintenance", "fa-undo", "btn-info"],
            'viewChart' : ["View Chart", "fa-line-chart", "btn-success viewChart"],
        };
        let html = `
        <a title="${templateButton[status][0]}" data-key-id="${user_key_id}" data-status="${ignore.includes(status) ? 'active' : status}" class="btn ${templateButton[status][2]} btn-circle ${status !='delete' ? 'change-status' : ''} status-action info inline ver-top" type="button">
            <i class="fa ${templateButton[status][1]} inline ver-top"></i>
        </a>
        `;
        return html;
    }
}
module.exports = helper;