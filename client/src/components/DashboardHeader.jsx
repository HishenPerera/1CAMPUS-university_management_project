import React from 'react';
import { Layout, Button, Space } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import ThemeToggle from './ThemeToggle';
import UserAvatar from './UserAvatar';
import lightLogo from '../assets/lightLogo.png';
import darkLogo from '../assets/darkLogo.png';
import { useTheme } from '../context/ThemeContext';

const { Header } = Layout;

const DashboardHeader = ({ 
    sidebarCollapsed, 
    setSidebarCollapsed, 
    userName, 
    userRole, 
    profileImage, 
    onAvatarUpload 
}) => {
    const { theme } = useTheme();
    const logo = theme === 'light' ? lightLogo : darkLogo;

    return (
        <Header className="dash-antd-header">
            <div className="header-left">
                <Button
                    type="text"
                    icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="sidebar-toggle-btn"
                />
                <div className="header-logo-wrap">
                    <img src={logo} alt="1CAMPUS" className="header-logo" />
                    <span className="header-logo-text">Student Admin</span>
                </div>
            </div>
            <div className="header-right">
                <Space size={24}>
                    <ThemeToggle />
                    <div className="header-user-info">
                        <UserAvatar 
                            name={userName} 
                            imageUrl={profileImage || undefined} 
                            onUpload={onAvatarUpload} 
                        />
                        <div className="user-details">
                            <span className="user-name">{userName || 'Admin'}</span>
                            <span className="user-role">{userRole || 'Staff'}</span>
                        </div>
                    </div>
                </Space>
            </div>
        </Header>
    );
};

export default DashboardHeader;
