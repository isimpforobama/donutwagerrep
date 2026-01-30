
export enum GameType {
  COIN_FLIP = 'COIN_FLIP',
  TOWERS = 'TOWERS',
  MINES = 'MINES',
  BACCARAT = 'BACCARAT',
  BLACKJACK = 'BLACKJACK',
  PLINKO = 'PLINKO',
  CRATES = 'CRATES',
  CHICKEN_CROSS = 'CHICKEN_CROSS',
  DASHBOARD = 'DASHBOARD',
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  TRANSACTION_HISTORY = 'TRANSACTION_HISTORY'
}

export interface UserStats {
  balance: number;
  totalWon: number;
  totalLost: number;
  gamesPlayed: number;
  level: number;
  xp: number;
}

export interface HistoryItem {
  id: string;
  game: GameType;
  amount: number;
  result: 'win' | 'loss';
  timestamp: number;
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string;
  points: number;
}
