import { useState } from 'react';
import Icon from '@/components/ui/icon';

type Message = { id: number; text: string; out: boolean; time: string; sender?: string };
type Chat = { id: number; name: string; avatar: string; online: boolean; isGroup: boolean; lastMsg: string; time: string; unread: number; messages: Message[] };

const CONTACTS: { id: number; name: string; avatar: string; online: boolean; status: string }[] = [];
const CHATS_INITIAL: Chat[] = [];
type View = 'chats' | 'contacts' | 'profile' | 'settings';

export default function Index() {
  const [activeView, setActiveView] = useState<View>('chats');
  const [activeChatId, setActiveChatId] = useState<number | null>(1);
  const [inputText, setInputText] = useState('');
  const [chats, setChats] = useState<Chat[]>(CHATS_INITIAL);
  const [search, setSearch] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);

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
          className="w-10 h-10 rounded-xl flex items-center justify-center text-destructive hover:bg-destructive/10 transition-all duration-200"
          title="Выйти"
        >
          <Icon name="LogOut" size={16} />
        </button>
      </nav>

      {/* Левая панель */}
      <aside className="n-chat-list flex flex-col w-72 shrink-0 border-r border-border">

        {/* Заголовок */}
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
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
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
                ВП
              </div>
              <p className="font-semibold text-sm">Владимир Петров</p>
              <p className="text-xs text-muted-foreground mt-1">@vladimir_petrov</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="n-online-dot w-2 h-2 rounded-full" />
                <span className="text-xs" style={{ color: 'hsl(var(--n-online))' }}>В сети</span>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Имя', value: 'Владимир Петров' },
                { label: 'Телефон', value: '+7 (999) 123-45-67' },
                { label: 'О себе', value: 'Разрабатываю полезные продукты' },
              ].map(field => (
                <div key={field.label} className="rounded-xl px-3 py-2.5 border border-border" style={{ background: 'hsl(var(--n-sidebar))' }}>
                  <p className="text-xs text-muted-foreground mb-0.5">{field.label}</p>
                  <p className="text-sm">{field.value}</p>
                </div>
              ))}
              <button
                className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'hsl(var(--n-accent))', color: 'hsl(220 16% 8%)' }}
              >
                Редактировать профиль
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
            {/* Шапка */}
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

            {/* Сообщения */}
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

            {/* Поле ввода */}
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
              <span className="text-3xl font-bold" style={{ color: 'hsl(var(--n-accent))' }}>Н</span>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-1">Добро пожаловать в Николай</h2>
              <p className="text-sm text-muted-foreground">Выберите чат слева, чтобы начать общение</p>
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