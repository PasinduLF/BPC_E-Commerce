const StatusLegend = () => {
    const items = [
        { label: 'Success', className: 'status-success', description: 'Completed, paid, delivered' },
        { label: 'Warning', className: 'status-warning', description: 'Pending, low stock, in progress' },
        { label: 'Error', className: 'status-error', description: 'Failed, unpaid, out of stock' },
    ];

    return (
        <div className="bg-surface rounded-xl border border-default p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary mb-2">Status Legend</p>
            <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                    <span key={item.label} title={item.description} className={`status-badge ${item.className}`}>
                        {item.label}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default StatusLegend;
