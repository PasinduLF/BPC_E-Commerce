import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { Shield, User, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';

const UserManage = () => {
    const { userInfo } = useAuthStore();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/users', config);
            setUsers(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [userInfo.token]);

    const deleteHandler = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete user ${name}?`)) {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.delete(`http://localhost:5000/api/users/${id}`, config);
                fetchUsers();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete user');
            }
        }
    };

    const toggleAdminRole = async (user) => {
        if (user._id === userInfo._id) {
            alert("You cannot change your own admin status here.");
            return;
        }

        if (window.confirm(`Change admin status for ${user.name}?`)) {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.put(`http://localhost:5000/api/users/${user._id}`, {
                    role: user.role === 'admin' ? 'customer' : 'admin'
                }, config);
                fetchUsers();
            } catch (error) {
                alert('Failed to update user role');
            }
        }
    };

    return (
        <div className="space-y-6">

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-primary">User Management</h1>
                    <p className="text-secondary text-sm mt-1">Manage customer accounts and administrative privileges.</p>
                </div>
            </div>

            <div className="bg-surface rounded-2xl shadow-sm border border-default overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-default">
                        <thead className="bg-page">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">ID</th>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-center font-semibold text-secondary uppercase tracking-wider">Admin</th>
                                <th className="px-6 py-4 text-center font-semibold text-secondary uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-default">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-8 text-secondary">Loading users...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-12 text-secondary">No users found.</td></tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user._id} className="hover:bg-page transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-tertiary font-mono text-xs">
                                            {user._id.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${user.role === 'admin' ? 'bg-brand' : 'bg-secondary'}`}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-primary">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-secondary">
                                            <a href={`mailto:${user.email}`} className="hover:text-brand transition-colors">{user.email}</a>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {user.role === 'admin' ? (
                                                <button onClick={() => toggleAdminRole(user)} className="inline-flex items-center justify-center p-1.5 bg-brand-subtle text-brand rounded-lg hover:brightness-95 transition-colors" title="Revoke Admin">
                                                    <Shield size={18} />
                                                </button>
                                            ) : (
                                                <button onClick={() => toggleAdminRole(user)} className="inline-flex items-center justify-center p-1.5 bg-page text-secondary rounded-lg hover:brightness-95 transition-colors" title="Make Admin">
                                                    <User size={18} />
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <button
                                                onClick={() => deleteHandler(user._id, user.name)}
                                                disabled={user.role === 'admin'}
                                                className="text-error hover:brightness-90 bg-error-bg hover:brightness-95 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Delete User"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default UserManage;
