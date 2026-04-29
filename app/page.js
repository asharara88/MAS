import React, { useState } from 'react';
import LibraryTab from './LibraryTab';
import ActiveTab from './ActiveTab';
import RunsTab from './RunsTab';
import InboxTab from './InboxTab';
import Home from './Home';

const AgentFactory = () => {
    const [activeTab, setActiveTab] = useState('home');

    const renderTab = () => {
        switch (activeTab) {
            case 'library':
                return <LibraryTab />;
            case 'active':
                return <ActiveTab />;
            case 'runs':
                return <RunsTab />;
            case 'inbox':
                return <InboxTab />;
            default:
                return <Home />;
        }
    };

    return (
        <div>
            <h1>Agent Factory</h1>
            <nav>
                <button onClick={() => setActiveTab('home')}>Home</button>
                <button onClick={() => setActiveTab('library')}>Library</button>
                <button onClick={() => setActiveTab('active')}>Active</button>
                <button onClick={() => setActiveTab('runs')}>Runs</button>
                <button onClick={() => setActiveTab('inbox')}>Inbox</button>
            </nav>
            <div>{renderTab()}</div>
        </div>
    );
};

export default AgentFactory;