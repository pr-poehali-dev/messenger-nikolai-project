import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

type Message = { id: number; text: string; out: boolean; time: string; sender?: string };
type Chat = { id: number; name: string; avatar: string; online: boolean; isGroup: boolean; lastMsg: string; time: string; unread: number; messages: Message[] };

const USERS_URL = 'https://functions.poehali.dev/6f0d02ea-428c-4249-a855-15daa6bc2fb2';

function getSessionId() {
  let sid = localStorage.getItem('nikolay_session');
  if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now(); localStorage.setItem('nikolay_session', sid); }
  return sid;
}

const CONTACTS: { id: number; name: string; avatar: string; online: boolean; status: string }[] = [];
const CHATS_INITIAL: Chat[] = [];
type View = 'chats' | 'contacts' | 'profile' | 'settings';
type FoundUser = { id: number; name: string; session_id: string; online: boolean };

function getInitials(name: string) {
  return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function WelcomeScreen({ onEnter }: { onEnter: (name: string) => void }) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    onEnter(name.trim());
  };

  return (
    <div className="h-full flex items-center justify-center font-golos" style={{ background: 'hsl(var(--n-chat-area))' }}>
      <div className="w-full max-w-sm px-6 animate-fade-in">

        {/* Логотип */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 n-glow"
            style={{ background: 'hsl(var(--n-accent))' }}
          >
            <span className="text-2xl font-bold" style={{ color: 'hsl(220 16% 8%)' }}>Н</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Николай</h1>
          <p className="text-sm text-muted-foreground mt-1.5 text-center">
            Мессенджер без регистрации.<br />Просто введи своё имя.
          </p>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Icon name="User" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Твоё имя"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              maxLength={32}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none border transition-all"
              style={{
                background: 'hsl(var(--n-chat-list))',
                color: 'hsl(var(--foreground))',
                borderColor: name.length >= 2 ? 'hsl(var(--n-accent) / 0.5)' : 'hsl(var(--border))',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={name.trim().length < 2}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-30"
            style={{ background: 'hsl(var(--n-accent))', color: 'hsl(220 16% 8%)' }}
          >
            Войти в Николай
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-5">
          Имя сохранится в браузере — в следующий раз входить не придётся
        </p>
      </div>
    </div>
  );
}

export default function Index() {
  const [myName, setMyName] = useState<string | null>(() => localStorage.getItem('nikolay_name'));
  const [activeView, setActiveView] = useState<View>('chats');
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [chats, setChats] = useState<Chat[]>(CHATS_INITIAL);
  const [search, setSearch] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [phoneSearchResult, setPhoneSearchResult] = useState<'idle' | 'searching' | 'found' | 'not_found'>('idle');
  const [nameSearch, setNameSearch] = useState('');
  const [nameSearchResult, setNameSearchResult] = useState<'idle' | 'searching' | 'found' | 'not_found'>('idle');
  const [foundUsers, setFoundUsers] = useState<FoundUser[]>([]);
  const [searchTab, setSearchTab] = useState<'name' | 'phone'>('name');

  const handleEnter = (name: string) => {
    localStorage.setItem('nikolay_name', name);
    setMyName(name);
    fetch(USERS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, session_id: getSessionId() }),
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('nikolay_name');
    setMyName(null);
    setActiveChatId(null);
    setChats([]);
  };

  const handlePhoneSearch = (val: string) => {
    setPhoneSearch(val);
    setPhoneSearchResult('idle');
    const digits = val.replace(/\D/g, '');
    if (digits.length >= 10) {
      setPhoneSearchResult('searching');
      setTimeout(() => setPhoneSearchResult('not_found'), 1200);
    }
  };

  const handleNameSearch = (val: string) => {
    setNameSearch(val);
    setFoundUsers([]);
    setNameSearchResult('idle');
    if (val.trim().length < 2) return;
    setNameSearchResult('searching');
    fetch(`${USERS_URL}?name=${encodeURIComponent(val.trim())}&session_id=${getSessionId()}`)
      .then(r => r.json())
      .then(data => {
        const users: FoundUser[] = JSON.parse(data).users ?? [];
        setFoundUsers(users);
        setNameSearchResult(users.length > 0 ? 'found' : 'not_found');
      })
      .catch(() => setNameSearchResult('not_found'));
  };

  // Регистрируем имя в БД при загрузке если уже вошли
  useEffect(() => {
    if (myName) {
      fetch(USERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: myName, session_id: getSessionId() }),
      });
    }
  }, [myName]);

  if (!myName) return <WelcomeScreen onEnter={handleEnter} />;

  const activeChat = chats.find(c => c.id === activeChatId);

  const filteredChats = chats.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredContacts = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const sendMessage = () => {
    if (!inputText.trim() || !activeChatId) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    setChats(prev => prev.map(c => {
      if (c.id !== activeChatId) return c;
      return {
        ...c,
        messages: [...c.messages, { id: Date.now(), text: inputText.trim(), out: true, time }],
        lastMsg: inputText.trim(),
        time,
        unread: 0,
      };
    }));
    setInputText('');
  };

  const createGroup = () => {
    if (!groupName.trim() || selectedContacts.length < 2) return;
    const newGroup: Chat = {
      id: Date.now(),
      name: groupName.trim(),
      avatar: '👥',
      online: false,
      isGroup: true,
      lastMsg: 'Группа создана',
      time: 'Сейчас',
      unread: 0,
      messages: [{ id: 1, text: 'Группа создана', out: true, time: 'Сейчас' }],
    };
    setChats(prev => [newGroup, ...prev]);
    setActiveChatId(newGroup.id);
    setActiveView('chats');
    setShowGroupModal(false);
    setGroupName('');
    setSelectedContacts([]);
  };

  const toggleContact = (id: number) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const navItems: { view: View; icon: string; label: string }[] = [
    { view: 'chats', icon: 'MessageCircle', label: 'Чаты' },
    { view: 'contacts', icon: 'Users', label: 'Контакты' },
    { view: 'profile', icon: 'User', label: 'Профиль' },
    { view: 'settings', icon: 'Settings', label: 'Настройки' },
  ];

  return (
    <div className="flex h-full font-golos overflow-hidden" style={{ background: 'hsl(var(--n-chat-area))' }}>

      {/* Боковая навигация */}
      <nav className="n-sidebar flex flex-col items-center py-4 gap-1 w-16 shrink-0 border-r border-border">
        <div className="mb-4 w-9 h-9 rounded-xl flex items-center justify-center n-glow-sm" style={{ background: 'hsl(var(--n-accent))' }}>
          <span className="text-sm font-bold" style={{ color: 'hsl(220 16% 8%)' }}>Н</span>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              title={item.label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                activeView === item.view
                  ? 'n-glow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              style={activeView === item.view ? {
                background: 'hsl(var(--n-accent) / 0.2)',
                color: 'hsl(var(--n-accent))',
              } : {}}
            >
              <Icon name={item.icon} size={18} />
            </button>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-destructive hover:bg-destructive/10 transition-all duration-200"
          title="Выйти"
        >
          <Icon name="LogOut" size={16} />
        </button>
      </nav>

      {/* Левая панель */}
      <aside className="n-chat-list flex flex-col w-72 shrink-0 border-r border-border">

        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-semibold">
              {activeView === 'chats' && 'Сообщения'}
              {activeView === 'contacts' && 'Контакты'}
              {activeView === 'profile' && 'Профиль'}
              {activeView === 'settings' && 'Настройки'}
            </h1>
            {activeView === 'chats' && (
              <button
                onClick={() => setShowGroupModal(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                style={{ background: 'hsl(var(--n-accent) / 0.15)', color: 'hsl(var(--n-accent))' }}
                title="Создать группу"
              >
                <Icon name="Plus" size={14} />
              </button>
            )}
            {activeView === 'contacts' && (
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                style={{ background: 'hsl(var(--n-accent) / 0.15)', color: 'hsl(var(--n-accent))' }}
                title="Добавить контакт"
              >
                <Icon name="UserPlus" size={14} />
              </button>
            )}
          </div>

          {(activeView === 'chats' || activeView === 'contacts') && (
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none transition-all border border-transparent focus:border-border"
                style={{ background: 'hsl(var(--n-sidebar))', color: 'hsl(var(--foreground))' }}
              />
            </div>
          )}
        </div>

        {/* Чаты */}
        {activeView === 'chats' && (
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {filteredChats.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-4">
                <Icon name="MessageCircle" size={28} className="text-muted-foreground opacity-40" />
                <p className="text-xs text-muted-foreground">Чатов пока нет.<br />Найди собеседника через контакты.</p>
              </div>
            )}
            {filteredChats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 ${
                  activeChatId === chat.id ? '' : 'hover:bg-muted/40'
                }`}
                style={activeChatId === chat.id ? { background: 'hsl(var(--n-accent) / 0.12)' } : {}}
              >
                <div className="relative shrink-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{
                      background: chat.isGroup ? 'hsl(var(--n-message-out))' : 'hsl(var(--n-accent) / 0.2)',
                      color: 'hsl(var(--n-accent))',
                    }}
                  >
                    {chat.avatar}
                  </div>
                  {chat.online && (
                    <span
                      className="n-online-dot online-pulse absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                      style={{ borderColor: 'hsl(var(--n-chat-list))' }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{chat.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-1">{chat.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-muted-foreground truncate">{chat.lastMsg}</span>
                    {chat.unread > 0 && (
                      <span
                        className="text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0 ml-1"
                        style={{ background: 'hsl(var(--n-accent))', color: 'hsl(220 16% 8%)' }}
                      >
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Контакты */}
        {activeView === 'contacts' && (
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            <div className="px-2 pb-3">

              {/* Табы */}
              <div className="flex rounded-xl overflow-hidden mb-3 p-0.5" style={{ background: 'hsl(var(--n-sidebar))' }}>
                {(['name', 'phone'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setSearchTab(tab); setNameSearch(''); setNameSearchResult('idle'); setPhoneSearch(''); setPhoneSearchResult('idle'); }}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={searchTab === tab ? {
                      background: 'hsl(var(--n-accent))',
                      color: 'hsl(220 16% 8%)',
                    } : {
                      color: 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {tab === 'name' ? 'По имени' : 'По номеру'}
                  </button>
                ))}
              </div>

              {/* Поиск по имени */}
              {searchTab === 'name' && (
                <>
                  <div className="relative">
                    <Icon name="User" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Введите имя..."
                      value={nameSearch}
                      onChange={e => handleNameSearch(e.target.value)}
                      autoFocus
                      className="w-full pl-8 pr-8 py-2 rounded-xl text-sm outline-none border border-transparent focus:border-border transition-all"
                      style={{ background: 'hsl(var(--n-sidebar))', color: 'hsl(var(--foreground))' }}
                    />
                    {nameSearchResult === 'searching' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--n-accent))', borderTopColor: 'transparent' }} />
                      </div>
                    )}
                  </div>
                  {nameSearchResult === 'not_found' && (
                    <div className="mt-2 px-3 py-2.5 rounded-xl border border-border text-xs text-muted-foreground flex items-center gap-2 animate-fade-in" style={{ background: 'hsl(var(--n-sidebar))' }}>
                      <Icon name="UserX" size={14} />
                      Пользователь с таким именем не найден
                    </div>
                  )}
                  {nameSearchResult === 'found' && foundUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        const existing = chats.find(c => !c.isGroup && c.name === user.name);
                        if (existing) { setActiveChatId(existing.id); setActiveView('chats'); return; }
                        const newChat: Chat = {
                          id: Date.now(), name: user.name,
                          avatar: getInitials(user.name), online: user.online, isGroup: false,
                          lastMsg: '', time: '', unread: 0, messages: [],
                        };
                        setChats(prev => [newChat, ...prev]);
                        setActiveChatId(newChat.id);
                        setActiveView('chats');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 mt-1.5 rounded-xl text-left transition-all hover:bg-muted/40 animate-fade-in border border-border"
                      style={{ background: 'hsl(var(--n-sidebar))' }}
                    >
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 relative"
                        style={{ background: 'hsl(var(--n-accent) / 0.2)', color: 'hsl(var(--n-accent))' }}>
                        {getInitials(user.name)}
                        {user.online && <span className="n-online-dot absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: 'hsl(var(--n-chat-list))' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.online ? 'В сети' : 'Не в сети'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg" style={{ background: 'hsl(var(--n-accent))', color: 'hsl(220 16% 8%)' }}>
                        <Icon name="MessageCircle" size={12} />
                        Написать
                      </div>
                    </button>
                  ))}
                  {!nameSearch && (
                    <p className="text-xs text-muted-foreground text-center mt-3 px-2">Введите имя, чтобы найти пользователя</p>
                  )}
                </>
              )}

              {/* Поиск по номеру */}
              {searchTab === 'phone' && (
                <>
                  <div className="relative">
                    <Icon name="Phone" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      value={phoneSearch}
                      onChange={e => handlePhoneSearch(e.target.value)}
                      autoFocus
                      className="w-full pl-8 pr-8 py-2 rounded-xl text-sm outline-none border border-transparent focus:border-border transition-all"
                      style={{ background: 'hsl(var(--n-sidebar))', color: 'hsl(var(--foreground))' }}
                    />
                    {phoneSearchResult === 'searching' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin" style={{ borderColor: 'hsl(var(--n-accent))', borderTopColor: 'transparent' }} />
                      </div>
                    )}
                  </div>
                  {phoneSearchResult === 'not_found' && (
                    <div className="mt-2 px-3 py-2.5 rounded-xl border border-border text-xs text-muted-foreground flex items-center gap-2 animate-fade-in" style={{ background: 'hsl(var(--n-sidebar))' }}>
                      <Icon name="UserX" size={14} />
                      Пользователь не найден
                    </div>
                  )}
                  {!phoneSearch && (
                    <p className="text-xs text-muted-foreground text-center mt-3 px-2">Введите номер телефона</p>
                  )}
                </>
              )}
            </div>
            {filteredContacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => {
                  const existing = chats.find(c => !c.isGroup && c.name === contact.name);
                  if (existing) { setActiveChatId(existing.id); setActiveView('chats'); }
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-muted/40 transition-all"
              >
                <div className="relative shrink-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{ background: 'hsl(var(--n-accent) / 0.2)', color: 'hsl(var(--n-accent))' }}
                  >
                    {contact.avatar}
                  </div>
                  {contact.online && (
                    <span
                      className="n-online-dot online-pulse absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                      style={{ borderColor: 'hsl(var(--n-chat-list))' }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{contact.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{contact.status}</p>
                </div>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                  <Icon name="MessageCircle" size={14} />
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Профиль */}
        {activeView === 'profile' && (
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="flex flex-col items-center pt-2 pb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold mb-3 n-glow"
                style={{ background: 'hsl(var(--n-accent) / 0.2)', color: 'hsl(var(--n-accent))' }}
              >
                {getInitials(myName)}
              </div>
              <p className="font-semibold text-sm">{myName}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="n-online-dot w-2 h-2 rounded-full" />
                <span className="text-xs" style={{ color: 'hsl(var(--n-online))' }}>В сети</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="rounded-xl px-3 py-2.5 border border-border" style={{ background: 'hsl(var(--n-sidebar))' }}>
                <p className="text-xs text-muted-foreground mb-0.5">Имя</p>
                <p className="text-sm">{myName}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
                style={{ background: 'hsl(var(--destructive) / 0.15)', color: 'hsl(var(--destructive))' }}
              >
                <Icon name="LogOut" size={14} />
                Выйти и сменить имя
              </button>
            </div>
          </div>
        )}

        {/* Настройки */}
        {activeView === 'settings' && (
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 pt-1">
            {[
              { icon: 'Bell', label: 'Уведомления', desc: 'Звуки и алерты' },
              { icon: 'Lock', label: 'Конфиденциальность', desc: 'Кто видит мой профиль' },
              { icon: 'Palette', label: 'Оформление', desc: 'Тема и шрифты' },
              { icon: 'Download', label: 'Данные', desc: 'Хранилище и кэш' },
              { icon: 'HelpCircle', label: 'Помощь', desc: 'FAQ и поддержка' },
            ].map(item => (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-muted/40 transition-all border border-border"
                style={{ background: 'hsl(var(--n-sidebar))' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'hsl(var(--n-accent) / 0.15)', color: 'hsl(var(--n-accent))' }}
                >
                  <Icon name={item.icon} size={15} />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Icon name="ChevronRight" size={14} className="ml-auto text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Область чата */}
      <main className="flex-1 flex flex-col min-w-0">
        {activeChat ? (
          <>
            <div
              className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0"
              style={{ background: 'hsl(var(--n-chat-list))' }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{
                      background: activeChat.isGroup ? 'hsl(var(--n-message-out))' : 'hsl(var(--n-accent) / 0.2)',
                      color: 'hsl(var(--n-accent))',
                    }}
                  >
                    {activeChat.avatar}
                  </div>
                  {activeChat.online && (
                    <span
                      className="n-online-dot online-pulse absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                      style={{ borderColor: 'hsl(var(--n-chat-list))' }}
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{activeChat.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeChat.isGroup
                      ? `${activeChat.messages.length} сообщений`
                      : activeChat.online ? 'В сети' : 'Не в сети'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[
                  { icon: 'Phone', title: 'Позвонить' },
                  { icon: 'Video', title: 'Видеозвонок' },
                  { icon: 'Search', title: 'Поиск в чате' },
                  { icon: 'MoreVertical', title: 'Ещё' },
                ].map(btn => (
                  <button
                    key={btn.icon}
                    title={btn.title}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  >
                    <Icon name={btn.icon} size={16} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {activeChat.messages.map((msg, i) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.out ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <div className={`max-w-[65%] ${!msg.out && activeChat.isGroup ? 'flex items-end gap-2' : ''}`}>
                    {!msg.out && activeChat.isGroup && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        style={{ background: 'hsl(var(--n-accent) / 0.2)', color: 'hsl(var(--n-accent))' }}
                      >
                        {msg.sender?.slice(0, 1) ?? '?'}
                      </div>
                    )}
                    <div>
                      {!msg.out && activeChat.isGroup && msg.sender && (
                        <p className="text-xs mb-1 pl-1" style={{ color: 'hsl(var(--n-accent))' }}>{msg.sender}</p>
                      )}
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${msg.out ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                        style={msg.out ? {
                          background: 'hsl(var(--n-message-out))',
                          color: 'hsl(var(--foreground))',
                        } : {
                          background: 'hsl(var(--n-message-in))',
                          color: 'hsl(var(--foreground))',
                        }}
                      >
                        {msg.text}
                      </div>
                      <div className={`text-xs text-muted-foreground mt-1 flex items-center gap-1 ${msg.out ? 'justify-end' : 'pl-1'}`}>
                        <span>{msg.time}</span>
                        {msg.out && <Icon name="CheckCheck" size={12} style={{ color: 'hsl(var(--n-accent))' }} />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="px-4 py-3 border-t border-border shrink-0"
              style={{ background: 'hsl(var(--n-chat-list))' }}
            >
              <div
                className="flex items-end gap-2 rounded-2xl px-3 py-2 border border-border"
                style={{ background: 'hsl(var(--n-sidebar))' }}
              >
                <button
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0 mb-0.5"
                  title="Прикрепить файл"
                >
                  <Icon name="Paperclip" size={16} />
                </button>
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder="Написать сообщение..."
                  rows={1}
                  className="flex-1 bg-transparent outline-none text-sm resize-none leading-relaxed max-h-28 py-1.5"
                  style={{ scrollbarWidth: 'none', color: 'hsl(var(--foreground))' }}
                />
                <button
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0 mb-0.5"
                  title="Emoji"
                >
                  <Icon name="Smile" size={16} />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 mb-0.5 disabled:opacity-30 hover:scale-105 active:scale-95"
                  style={inputText.trim() ? {
                    background: 'hsl(var(--n-accent))',
                    color: 'hsl(220 16% 8%)',
                  } : {
                    background: 'hsl(var(--muted))',
                    color: 'hsl(var(--muted-foreground))',
                  }}
                  title="Отправить"
                >
                  <Icon name="Send" size={14} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">Enter — отправить · Shift+Enter — новая строка</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center n-glow"
              style={{ background: 'hsl(var(--n-accent) / 0.1)' }}
            >
              <span className="text-3xl font-bold" style={{ color: 'hsl(var(--n-accent))' }}>{getInitials(myName)}</span>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-1">Привет, {myName}!</h2>
              <p className="text-sm text-muted-foreground">Выберите чат или найдите собеседника по номеру</p>
            </div>
          </div>
        )}
      </main>

      {/* Модал создания группы */}
      {showGroupModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowGroupModal(false); }}
        >
          <div
            className="w-80 rounded-2xl p-5 border border-border animate-scale-in"
            style={{ background: 'hsl(var(--n-chat-list))' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Создать группу</h3>
              <button
                onClick={() => setShowGroupModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <Icon name="X" size={15} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Название группы"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border border-border focus:border-ring transition-all mb-3"
              style={{ background: 'hsl(var(--n-sidebar))', color: 'hsl(var(--foreground))' }}
            />
            <p className="text-xs text-muted-foreground mb-2">
              Выберите участников ({selectedContacts.length} выбрано, мин. 2):
            </p>
            <div className="space-y-1 max-h-44 overflow-y-auto mb-4">
              {CONTACTS.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Контактов пока нет</p>
              )}
              {CONTACTS.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => toggleContact(contact.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all hover:bg-muted/40"
                  style={selectedContacts.includes(contact.id) ? { background: 'hsl(var(--n-accent) / 0.15)' } : {}}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{ background: 'hsl(var(--n-accent) / 0.2)', color: 'hsl(var(--n-accent))' }}
                  >
                    {contact.avatar}
                  </div>
                  <span className="text-sm flex-1">{contact.name}</span>
                  {selectedContacts.includes(contact.id) && (
                    <Icon name="Check" size={14} style={{ color: 'hsl(var(--n-accent))' }} />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={createGroup}
              disabled={!groupName.trim() || selectedContacts.length < 2}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
              style={{ background: 'hsl(var(--n-accent))', color: 'hsl(220 16% 8%)' }}
            >
              {selectedContacts.length < 2
                ? `Нужно выбрать ещё ${2 - selectedContacts.length}`
                : `Создать группу (${selectedContacts.length} участника)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}