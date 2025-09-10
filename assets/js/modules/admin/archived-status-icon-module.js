// archived-status-icon-module.js
// Returns icon HTML for archived reservation statuses

function getArchivedStatusIcon(status) {
    status = (status || '').toLowerCase();
    if (status === 'checked-out') {
        return '<i class="fas fa-archive text-success" title="Archived (Checked Out)"></i>';
    }
    if (status === 'cancelled') {
        return '<i class="fas fa-ban text-danger" title="Archived (Cancelled)"></i>';
    }
    return '';
}

export { getArchivedStatusIcon };
