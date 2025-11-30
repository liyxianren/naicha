import React, { useState, useEffect } from 'react';
import { App, Modal, Typography, Input, Space, Button, Tag, Avatar, Badge, Tooltip } from 'antd';
import { 
  GlobalOutlined, UserOutlined, TrophyOutlined, 
  SoundOutlined, PlusOutlined, RocketOutlined,
  SettingOutlined, LogoutOutlined, TeamOutlined,
  FireOutlined, RiseOutlined, HistoryOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { gameApi, playerApi } from '../api';
import { useGameStore } from '../stores/gameStore';
import { useSessionStore } from '../stores/sessionStore';
import { useLanguageStore } from '../stores/languageStore';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigate } from 'react-router-dom';
import type { Game } from '../types';

const { Text, Title } = Typography;

export const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { setCurrentGame, setCurrentPlayer } = useGameStore();
  const { sessionToken, nickname, hydrateFromStorage, hydrated, setPlayerContext, clearSession } = useSessionStore();
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'zh-CN' ? 'en-US' : 'zh-CN');
  };
  const [games, setGames] = useState<Game[]>([]);
  const [_loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [activeTab, setActiveTab] = useState('lobby'); // 'lobby' | 'rank' | 'history'

  // 模拟头像
  const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${nickname || 'player'}`;

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!hydrated) return;
    if (!sessionToken) {
      navigate('/login');
    }
  }, [hydrated, sessionToken, navigate]);

  const loadGames = async () => {
    setLoading(true);
    try {
      const response = await gameApi.getGames();
      if (response.success && response.data) {
        setGames(response.data.filter(g => g.status === 'waiting'));
      }
    } catch (error: any) {
      // Silent fail for intervals
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionToken) return;
    loadGames();
    const interval = setInterval(loadGames, 5000);
    return () => clearInterval(interval);
  }, [sessionToken]);

  const handleCreateGame = async () => {
    const finalGameName = nickname ? `${nickname}的奶茶店` : '新开张的奶茶店';

    if (!sessionToken) {
      message.error('Please log in first');
      navigate('/login');
      return;
    }

    try {
      const response = await gameApi.createGame({
        name: finalGameName,
        max_players: maxPlayers,
        player_name: (nickname || '').trim() || '玩家',
        session_token: sessionToken,
      });

      if (response.success && response.data) {
        message.success('店铺选址成功！');
        setCurrentGame(response.data.game);
        setCurrentPlayer(response.data.player);
        setPlayerContext(response.data.player.id, response.data.game.id);
        setCreateModalVisible(false);
        navigate('/room');
      }
    } catch (error: any) {
      message.error(error.error || 'Create room failed');
    }
  };

  const handleJoinGame = async () => {
    if (!selectedGame) {
      message.warning('Please select a room');
      return;
    }
    if (!sessionToken) {
      message.error('Please log in first');
      navigate('/login');
      return;
    }

    try {
      const response = await playerApi.joinGame({
        game_id: selectedGame.id,
        player_name: (nickname || '玩家'),
        session_token: sessionToken,
      });

      if (response.success && response.data) {
        message.success('入职成功！');
        setCurrentGame(selectedGame);
        setCurrentPlayer(response.data);
        setPlayerContext(response.data.id, selectedGame.id);
        setJoinModalVisible(false);
        navigate('/room');
      }
    } catch (error: any) {
      message.error(error.error || 'Join room failed');
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  // Mock Components
  const RankList = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-[#F0E6D2] overflow-hidden"
    >
      <div className="grid grid-cols-12 gap-4 p-4 bg-[#FFF8E1] border-b border-[#F0E6D2] font-bold text-[#8B6F47] text-xs uppercase tracking-wider">
        <div className="col-span-2 pl-2">排名</div>
        <div className="col-span-5">玩家</div>
        <div className="col-span-3 text-right">总资产</div>
        <div className="col-span-2 text-right">胜率</div>
      </div>
      {[
        { name: '奶茶大亨', assets: 98000, win: '88%', seed: 'king' },
        { name: '波霸王子', assets: 76500, win: '72%', seed: 'prince' },
        { name: '柠檬精', assets: 54000, win: '65%', seed: 'lemon' },
        { name: '椰果妹妹', assets: 43200, win: '58%', seed: 'coco' },
        { name: '全糖去冰', assets: 32100, win: '51%', seed: 'sugar' },
        { name: '三分甜', assets: 28000, win: '48%', seed: 'three' },
        { name: '店小二', assets: 15000, win: '30%', seed: 'waiter' },
      ].map((item, index) => (
        <div 
          key={index} 
          className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#FFFBF7] transition-colors border-b border-[#F0E6D2] last:border-none"
        >
          <div className="col-span-2 pl-2 font-black text-[#4A3B32] text-lg flex items-center gap-2">
            {index === 0 && <CrownOutlined className="text-[#FFD700]" />}
            {index === 1 && <CrownOutlined className="text-[#C0C0C0]" />}
            {index === 2 && <CrownOutlined className="text-[#CD7F32]" />}
            <span className={index < 3 ? 'text-[#4A3B32]' : 'text-[#9C826B]'}>{index + 1}</span>
          </div>
          <div className="col-span-5 flex items-center gap-3">
            <Avatar src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${item.seed}`} shape="square" className="border border-[#F0E6D2]" />
            <span className="font-bold text-[#4A3B32]">{item.name}</span>
            {index === 0 && <Tag color="gold" className="m-0 border-none text-[10px]">LEGEND</Tag>}
          </div>
          <div className="col-span-3 text-right font-bold text-[#4A3B32]">
            ¥ {item.assets.toLocaleString()}
          </div>
          <div className="col-span-2 text-right">
            <Tag color={parseInt(item.win) > 60 ? 'green' : 'orange'} className="rounded-full border-none font-bold">
              {item.win}
            </Tag>
          </div>
        </div>
      ))}
    </motion.div>
  );

  const HistoryList = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-[#F0E6D2] overflow-hidden"
    >
       <div className="p-6 text-center border-b border-[#F0E6D2] bg-[#FFFBF7]">
         <div className="grid grid-cols-3 gap-4">
           <div className="bg-white p-4 rounded-xl border border-[#F0E6D2]">
             <div className="text-xs text-[#9C826B] uppercase font-bold mb-1">总收益</div>
             <div className="text-xl font-black text-[#7ED957]">+ ¥12,450</div>
           </div>
           <div className="bg-white p-4 rounded-xl border border-[#F0E6D2]">
             <div className="text-xs text-[#9C826B] uppercase font-bold mb-1">最高排名</div>
             <div className="text-xl font-black text-[#FFB648]">No. 1</div>
           </div>
           <div className="bg-white p-4 rounded-xl border border-[#F0E6D2]">
             <div className="text-xs text-[#9C826B] uppercase font-bold mb-1">游戏时长</div>
             <div className="text-xl font-black text-[#4A3B32]">4.5h</div>
           </div>
         </div>
       </div>
       
       <div className="p-4">
         <h3 className="text-sm font-bold text-[#8B6F47] uppercase tracking-wider mb-4 ml-2">最近战绩</h3>
         <div className="space-y-3">
           {[
             { room: '欢乐谷分店', rank: 1, profit: 5400, date: '2023-11-29', type: 'win' },
             { room: '大学城店', rank: 2, profit: 2100, date: '2023-11-28', type: 'draw' },
             { room: '商业街一号', rank: 4, profit: -800, date: '2023-11-28', type: 'lose' },
             { room: '海滨公园', rank: 1, profit: 4200, date: '2023-11-27', type: 'win' },
           ].map((item, i) => (
             <div key={i} className="bg-[#F9F5F1] rounded-xl p-4 flex items-center justify-between hover:bg-[#F0EBE5] transition-colors">
               <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                   item.type === 'win' ? 'bg-[#E8F5E9] text-[#7ED957]' :
                   item.type === 'lose' ? 'bg-[#FFEBEE] text-[#FF6B6B]' :
                   'bg-[#FFF3E0] text-[#FFB74D]'
                 }`}>
                   {item.rank}
                 </div>
                 <div>
                   <div className="font-bold text-[#4A3B32]">{item.room}</div>
                   <div className="text-xs text-[#9C826B]">{item.date}</div>
                 </div>
               </div>
               <div className={`font-black ${
                 item.profit > 0 ? 'text-[#7ED957]' : 'text-[#FF6B6B]'
               }`}>
                 {item.profit > 0 ? '+' : ''}¥ {item.profit}
               </div>
             </div>
           ))}
         </div>
       </div>
    </motion.div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFFBF7] font-sans">
      {/* 左侧导航栏 Sidebar */}
      <aside className="w-72 bg-white border-r-2 border-[#F0E6D2] flex flex-col shadow-sm z-20">
        {/* Logo Area */}
        <div className="p-6 border-b-2 border-[#F0E6D2] bg-[#FFFEFC]">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
              className="text-4xl filter drop-shadow-sm"
            >
              🧋
            </motion.div>
            <div>
              <h1 className="text-lg font-black text-[#4A3B32] m-0 leading-none tracking-tight">MILK TEA</h1>
              <span className="text-xs font-bold text-[#9C826B] tracking-widest">BATTLE ROYAL</span>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="p-6 pb-2">
          <div className="bg-[#FFF0E6] rounded-2xl p-4 border-2 border-[#FFD1DC] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white opacity-40 rounded-full -mr-8 -mt-8"></div>
            
            <div className="flex items-center gap-4 mb-3 relative z-10">
              <div className="relative">
                <Avatar 
                  size={56} 
                  src={avatarUrl} 
                  className="border-2 border-white shadow-md bg-white"
                />
                <div className="absolute -bottom-1 -right-1 bg-[#7ED957] w-4 h-4 rounded-full border-2 border-white" title="Online"></div>
              </div>
              <div>
                <Text strong className="block text-lg text-[#4A3B32] truncate max-w-[100px]">{nickname || '店长'}</Text>
                <Tag color="orange" className="m-0 text-[10px] rounded-full border-none px-2 bg-[#FFB648] text-[#4A3B32] font-bold shadow-sm">
                  Lv.3 见习店长
                </Tag>
              </div>
            </div>
            
            {/* Stats Mini Grid */}
            <div className="grid grid-cols-2 gap-2 mt-2 relative z-10">
               <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-[#F0E6D2]">
                 <div className="text-[10px] text-[#8B6F47] font-bold">胜率</div>
                 <div className="text-sm font-black text-[#4A3B32]">58%</div>
               </div>
               <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-[#F0E6D2]">
                 <div className="text-[10px] text-[#8B6F47] font-bold">场次</div>
                 <div className="text-sm font-black text-[#4A3B32]">12</div>
               </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('lobby')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
              activeTab === 'lobby'
                ? 'bg-gradient-to-r from-[#D4A574] to-[#C89968] text-[#4A3B32] shadow-md font-bold'
                : 'text-[#8B6F47] hover:bg-[#F5F0EB] font-bold'
            }`}
          >
            <RocketOutlined className="text-lg" />
            <span>{t('lobby.gameLobby')}</span>
            {activeTab === 'lobby' && <div className="ml-auto w-2 h-2 bg-[#7ED957] rounded-full animate-pulse"></div>}
          </button>

          <button
            onClick={() => setActiveTab('rank')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
              activeTab === 'rank'
                ? 'bg-gradient-to-r from-[#D4A574] to-[#C89968] text-[#4A3B32] shadow-md font-bold'
                : 'text-[#8B6F47] hover:bg-[#F5F0EB] font-bold'
            }`}
          >
            <TrophyOutlined className="text-lg" />
            <span>{t('lobby.ranking')}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-[#D4A574] to-[#C89968] text-[#4A3B32] shadow-md font-bold'
                : 'text-[#8B6F47] hover:bg-[#F5F0EB] font-bold'
            }`}
          >
            <HistoryOutlined className="text-lg" />
            <span>{t('lobby.businessReport')}</span>
          </button>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t-2 border-[#F0E6D2]">
           <button
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-2 text-[#FF6B6B] hover:bg-[#FFF0F0] p-2 rounded-lg transition-colors font-bold text-sm"
           >
             <LogoutOutlined /> {t('lobby.logout')}
           </button>
        </div>
      </aside>

      {/* 主内容区 Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header Bar */}
        <header className="h-20 px-8 flex items-center justify-between bg-white border-b border-[#F0E6D2] sticky top-0 z-10 shadow-sm">
           <div>
             <Title level={4} style={{ margin: 0, color: '#4A3B32' }}>
               {activeTab === 'lobby' ? t('lobby.gameLobby') : activeTab === 'rank' ? t('lobby.ranking') : t('lobby.businessReport')}
             </Title>
             <Text type="secondary" className="text-xs">
               {activeTab === 'lobby' ? t('lobby.lobbySubtitle') : activeTab === 'rank' ? t('lobby.rankingSubtitle') : t('lobby.reportSubtitle')}
             </Text>
           </div>

           <div className="flex items-center gap-4">
              {/* 语言切换按钮 - 更明显的设计 */}
              <button
                onClick={toggleLanguage}
                className="group relative px-4 py-2 rounded-xl bg-gradient-to-r from-[#E8F5E9] to-[#F1F8E9] border-2 border-[#7ED957] hover:border-[#6BCF00] transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <GlobalOutlined className="text-[#7ED957] text-lg" />
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-[#9C826B] font-bold uppercase leading-tight">Language</span>
                  <span className="text-sm font-black text-[#4A3B32] leading-tight">
                    {language === 'zh-CN' ? '中文' : 'English'}
                  </span>
                </div>
                {/* 提示箭头 */}
                <div className="absolute -right-1 -top-1 w-3 h-3 bg-[#FFB648] rounded-full animate-pulse"></div>
              </button>

              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
                className="shadow-lg hover-lift"
                style={{
                  background: 'linear-gradient(135deg, #4A3B32 0%, #2C1810 100%)',
                  border: 'none',
                  height: '48px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  borderRadius: '12px',
                  fontWeight: 'bold'
                }}
              >
                {t('lobby.createRoom')}
              </Button>
           </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           
           {/* Top Stats Row */}
           {activeTab === 'lobby' && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
             >
                <div className="bg-white rounded-2xl p-5 border border-[#F0E6D2] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                   <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-2xl">🏠</div>
                   <div>
                      <div className="text-xs text-[#9C826B] font-bold uppercase tracking-wider">{t('lobby.onlineRooms')}</div>
                      <div className="text-2xl font-black text-[#4A3B32]">{games.length}</div>
                   </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#F0E6D2] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                   <div className="w-12 h-12 rounded-xl bg-[#E3F2FD] flex items-center justify-center text-2xl">👥</div>
                   <div>
                      <div className="text-xs text-[#9C826B] font-bold uppercase tracking-wider">{t('lobby.onlinePlayers')}</div>
                      <div className="text-2xl font-black text-[#4A3B32]">{games.reduce((acc, g) => acc + (Number(g.current_players) || 0), 0)}</div>
                   </div>
                </div>

                {/* 公告栏 - 使用渐变背景和深色文字 */}
                <div className="bg-gradient-to-br from-[#FFE5B4] to-[#FFD1DC] rounded-2xl p-5 shadow-md flex items-center justify-between relative overflow-hidden border-2 border-[#FFB648]">
                   <div className="relative z-10">
                      <div className="text-xs font-bold uppercase tracking-wider mb-1 text-[#8B6F47]">{t('lobby.todayAnnouncement')}</div>
                      <div className="font-bold tracking-wide text-sm text-[#4A3B32]">{t('lobby.announcement')}</div>
                   </div>
                   <SoundOutlined className="text-2xl text-[#FFB648] relative z-10" />
                   {/* Decor */}
                   <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[#FFB648]/10 rounded-full"></div>
                </div>
             </motion.div>
           )}

           {/* Main Content Area */}
           <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                 {activeTab === 'lobby' ? (
                   <>
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-[#4A3B32] flex items-center gap-2">
                           <FireOutlined className="text-[#FF6B6B]" />
                           {t('lobby.hotRooms')}
                        </h3>
                        <div className="flex gap-2">
                          <Tag className="rounded-full px-3 cursor-pointer hover:opacity-80 transition-opacity bg-gradient-to-r from-[#D4A574] to-[#C89968] text-[#4A3B32] border-none py-1 font-bold shadow-sm">{t('lobby.all')}</Tag>
                          <Tag className="rounded-full px-3 cursor-pointer hover:opacity-80 transition-opacity bg-white border border-[#F0E6D2] text-[#8B6F47] py-1 font-bold">{t('lobby.waiting')}</Tag>
                        </div>
                     </div>

                     {games.length === 0 ? (
                       <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-[#F0E6D2]">
                          <div className="text-6xl mb-4 opacity-50">🥡</div>
                          <h3 className="text-lg font-bold text-[#8B6F47] mb-2">{t('lobby.noRooms')}</h3>
                          <p className="text-[#9C826B] mb-6">{t('lobby.noRoomsDesc')}</p>
                          <Button onClick={() => setCreateModalVisible(true)}>{t('lobby.createFirstRoom')}</Button>
                       </div>
                     ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          <AnimatePresence>
                            {games.map((game, i) => (
                               <motion.div
                                 key={game.id}
                                 initial={{ opacity: 0, scale: 0.9 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 transition={{ delay: i * 0.05 }}
                                 onClick={() => {
                                   setSelectedGame(game);
                                   setJoinModalVisible(true);
                                 }}
                                 className="group bg-white rounded-2xl p-4 border-2 border-[#F0E6D2] hover:border-[#4A3B32] hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
                               >
                                  {/* 右上角人数徽章 */}
                                  <div className="absolute top-0 right-0 bg-gradient-to-r from-[#7ED957] to-[#6BCF00] text-white text-xs font-bold px-3 py-1.5 rounded-bl-xl z-10 shadow-md flex items-center gap-1">
                                     <TeamOutlined className="text-sm" />
                                     <span>{game.current_players}/{game.max_players}</span>
                                  </div>

                                  <div className="flex items-start justify-between mb-4">
                                     <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFF0E6] to-[#FFD1DC] flex items-center justify-center text-2xl shadow-inner">
                                        {i % 3 === 0 ? '🧋' : i % 3 === 1 ? '🥥' : '🍋'}
                                     </div>
                                     <div className="text-right">
                                        <div className="text-xs text-[#8B6F47] font-bold">{t('lobby.status.waiting')}</div>
                                        <div className="text-xs text-[#9C826B] mt-1">{t('lobby.round')} {game.current_round}</div>
                                     </div>
                                  </div>

                                  <h4 className="text-base font-bold text-[#4A3B32] mb-1 truncate">{game.name}</h4>
                                  <div className="flex items-center gap-2 text-xs text-[#9C826B] mb-4">
                                     <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                     {t('lobby.round')} {game.current_round}/10
                                  </div>

                                  <Button
                                    block
                                    type="primary"
                                    className="rounded-xl bg-[#F5F0EB] text-[#4A3B32] border-none font-bold group-hover:bg-[#4A3B32] group-hover:text-white transition-colors"
                                  >
                                    {t('lobby.joinNow')}
                                  </Button>
                               </motion.div>
                            ))}
                          </AnimatePresence>
                       </div>
                     )}
                   </>
                 ) : activeTab === 'rank' ? (
                   <RankList />
                 ) : (
                   <HistoryList />
                 )}
              </div>

              {/* Right: Widgets Column */}
              {activeTab === 'lobby' && (
                <div className="w-full lg:w-80 space-y-6 hidden lg:block">
                   {/* 排行榜 Widget */}
                   <div className="bg-white rounded-2xl border border-[#F0E6D2] shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-[#F0E6D2] flex justify-between items-center bg-[#FFFEFC]">
                         <span className="font-bold text-[#4A3B32]">🏆 {t('lobby.wealthRank')}</span>
                         <span className="text-xs text-[#9C826B] cursor-pointer hover:text-[#4A3B32]" onClick={() => setActiveTab('rank')}>{t('lobby.viewAll')}</span>
                      </div>
                      <div className="p-2">
                         {[1, 2, 3].map((rank) => (
                            <div key={rank} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#FFFBF7] transition-colors cursor-pointer">
                               <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                 rank === 1 ? 'bg-[#FFD700] text-[#8B6F47]' : 
                                 rank === 2 ? 'bg-[#C0C0C0] text-white' : 
                                 'bg-[#CD7F32] text-white'
                               }`}>
                                 {rank}
                               </div>
                               <Avatar size={32} src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=rank${rank}`} />
                               <div className="flex-1 min-w-0">
                                  <div className="text-sm font-bold text-[#4A3B32] truncate">奶茶大亨{rank}号</div>
                                  <div className="text-xs text-[#9C826B]">¥ {(10000 - rank * 1200).toLocaleString()}</div>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* 小贴士 Widget */}
                   <div className="bg-[#FFF8E1] rounded-2xl p-5 border border-[#FFE082] relative overflow-hidden">
                      <div className="relative z-10">
                         <div className="font-bold text-[#F57F17] mb-2 flex items-center gap-2">
                            <span className="text-lg">💡</span> {t('lobby.businessTips')}
                         </div>
                         <p className="text-sm text-[#F9A825] leading-relaxed">
                            {t('lobby.rainyDayTip')}
                         </p>
                      </div>
                      <div className="absolute -right-2 -bottom-2 text-6xl opacity-10">☂️</div>
                   </div>
                </div>
              )}
           </div>
        </div>
      </main>

      {/* 创建房间Modal */}
      <Modal
        open={createModalVisible}
        onOk={handleCreateGame}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={400}
        className="rounded-3xl overflow-hidden"
        closeIcon={null}
        centered
      >
         <div className="text-center p-2">
            <div className="w-16 h-16 bg-[#FFF0E6] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 text-[#FF6B6B]">
               🚀
            </div>
            <h2 className="text-2xl font-black text-[#4A3B32] mb-2">{t('lobby.openNewBranch')}</h2>
            <p className="text-[#9C826B] mb-6 text-sm">{t('lobby.createRoomDesc')}</p>

            <div className="space-y-4 text-left">
               <div>
                  <label className="text-xs font-bold text-[#8B6F47] uppercase ml-1 mb-1 block">{t('lobby.roomNameLabel')}</label>
                  <div className="bg-[#F5F0EB] p-3 rounded-xl text-[#4A3B32] font-bold border border-transparent focus-within:border-[#4A3B32] transition-colors">
                     {nickname ? `${nickname}的奶茶店` : '新开张的奶茶店'}
                  </div>
               </div>

               <div>
                  <label className="text-xs font-bold text-[#8B6F47] uppercase ml-1 mb-1 block">{t('lobby.maxPlayersLabel')}</label>
                  <div className="grid grid-cols-3 gap-2">
                     {[2, 3, 4].map(num => (
                        <button
                          key={num}
                          onClick={() => setMaxPlayers(num)}
                          className={`p-3 rounded-xl font-bold transition-all ${
                             maxPlayers === num
                             ? 'bg-white text-[#4A3B32] shadow-xl shadow-[#4A3B32]/40 scale-110 border-4 border-[#4A3B32] ring-2 ring-[#D4A574]'
                             : 'bg-[#F5F0EB] text-[#8B6F47] hover:bg-[#E8E0D9] border-2 border-[#F0E6D2] hover:border-[#D4A574]'
                          }`}
                        >
                           {num}{t('lobby.peopleUnit')}
                        </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="flex gap-3 mt-8">
               <Button
                 size="large"
                 className="flex-1 rounded-xl h-12 font-bold border-none bg-[#F5F0EB] text-[#8B6F47] hover:bg-[#E8E0D9]"
                 onClick={() => setCreateModalVisible(false)}
               >
                  {t('lobby.cancelButton')}
               </Button>
               <Button
                 type="primary"
                 size="large"
                 className="flex-1 rounded-xl h-12 font-bold bg-[#4A3B32] hover:bg-[#2C1810] border-none shadow-lg shadow-[#4A3B32]/20"
                 onClick={handleCreateGame}
               >
                  {t('lobby.createNowButton')}
               </Button>
            </div>
         </div>
      </Modal>

      {/* 加入房间Modal */}
      <Modal
        open={joinModalVisible}
        onOk={handleJoinGame}
        onCancel={() => setJoinModalVisible(false)}
        footer={null}
        width={400}
        centered
        closeIcon={null}
      >
         <div className="text-center p-2">
            <div className="w-16 h-16 bg-[#E3F2FD] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 text-[#2196F3]">
               👋
            </div>
            <h2 className="text-2xl font-black text-[#4A3B32] mb-2">{t('lobby.joinGameTitle')}</h2>
            <p className="text-[#9C826B] mb-6 text-sm">{t('lobby.joinGameDesc')} <span className="font-bold text-[#4A3B32]">"{selectedGame?.name}"</span> {t('lobby.joinGameDescSuffix')}</p>

            <div className="flex gap-3 mt-6">
               <Button
                 size="large"
                 className="flex-1 rounded-xl h-12 font-bold border-none bg-[#F5F0EB] text-[#8B6F47] hover:bg-[#E8E0D9]"
                 onClick={() => setJoinModalVisible(false)}
               >
                  {t('lobby.takeLook')}
               </Button>
               <Button
                 type="primary"
                 size="large"
                 className="flex-1 rounded-xl h-12 font-bold bg-[#7ED957] hover:bg-[#6BCF00] border-none shadow-lg shadow-[#7ED957]/20 text-[#4A3B32]"
                 onClick={handleJoinGame}
               >
                  {t('lobby.confirmJoinButton')}
               </Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};
