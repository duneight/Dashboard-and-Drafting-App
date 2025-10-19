// League settings for "Keeper Tight League"
// Hardcoded for single league. Future: make configurable for multi-league support

import { LeagueSettings } from '@/types/draft'

export const LEAGUE_SETTINGS: LeagueSettings = {
  type: 'Head-to-Head Points',
  teams: 10,
  owners: [
    'Luke (1st)', 
    'Dinesh (2nd)', 
    'Glis (3rd)', 
    'Toph (4th)', 
    'Geoff (5th)', 
    'Whidds (6th)', 
    'Dooger (7th)', 
    'Bendy (8th)', 
    'Blake (9th)', 
    'Deke (10th)'
  ],
  numRounds: 25,
  rosterPositions: {
    centers: 4,
    leftWings: 4, 
    rightWings: 4,
    defensemen: 6,
    goalies: 2,
    bench: 5,
    irPlus: 4,
    na: 2
  },
  pointStructure: {
    offensive: {
      goals: 3.0,
      assists: 2.0,
      plusMinus: 1.0,
      powerplayGoals: 0.5,
      powerplayAssists: 0.5,
      gameWinningGoals: 0.5,
      shotsOnGoal: 0.4
    },
    goaltending: {
      wins: 3.0,
      goalsAgainst: -1.0,
      saves: 0.2,
      shutouts: 2.0
    }
  }
}

// Prefilled draft data from MVP (keeper data)
export const initialPrefilledData: Record<number, string[]> = {
  1: ["Connor Bedard", "Matt Boldy", "Adrian Kempe", "Sidney Crosby", "Auston Matthews", "Nikita Kucherov", "Kyle Connor", "Connor McDavid", "Cale Makar", "Leon Draisaitl"],
  2: ["Macklin Celebrini", "Lucas Raymond", "Jordan Kyrou", "Sam Reinhart", "Connor Hellebuyck", "Jack Hughes", "Zach Werenski", "Nathan MacKinnon", "Mikko Rantanen", "David Pastrnak"],
  3: ["John Tavares", "Dylan Holloway", "Cole Caufield", "Tage Thompson", "Dustin Wolf", "Tim Stützle", "Nick Suzuki", "Jack Eichel", "William Nylander", "Mitch Marner"],
  4: ["Jason Robertson", "Quinton Byfield", "J.T. Miller", "Mark Scheifele", "Timo Meier", "Nico Hischier", "Clayton Keller", "Sebastian Aho", "Brayden Point", "Alex Ovechkin"],
  5: ["Alex DeBrincat", "Cutter Gauthier", "Jesper Bratt", "Dylan Guenther", "Bo Horvat", "", "Filip Forsberg", "Kirill Kaprizov", "Artemi Panarin", "Kirill Marchenko"],
  6: ["Adam Fantilli", "Alex Tuch", "Seth Jarvis", "Elias Pettersson", "JJ Peterka", "Martin Necas", "Dylan Larkin", "Jake Guentzel", "Victor Hedman", "Travis Konecny"],
  7: ["Brandon Hagel", "Logan Cooley", "Moritz Seider", "Evan Bouchard", "Dougie Hamilton", "Josh Morrissey", "Roope Hintz", "Brady Tkachuk", "Robert Thomas", "Matvei Michkov"],
  8: ["Aliaksei Protas", "Leo Carlsson", "Miro Heiskanen", "Mackenzie Blackwood", "Matthew Tkachuk", "", "Shea Theodore", "Quinn Hughes", "Wyatt Johnston", "Jake Sanderson"],
  9: ["Adam Fox", "Lane Hutson", "", "", "", "", "Juraj Slafkovsky", "Rasmus Dahlin", "Dylan Strome", "Jake Oettinger"],
  10: ["Adin Hill", "Logan Thompson", "", "", "", "", "Ilya Sorokin", "Thomas Harley", "Andrei Vasilevskiy", "Igor Shesterkin"],
}

// Position colors for styling
export const positionColors = { 
  C: 'pos-f', 
  LW: 'pos-f', 
  RW: 'pos-f', 
  D: 'pos-d', 
  G: 'pos-g' 
}

export const positionTextColors = { 
  C: 'pos-f-text', 
  LW: 'pos-f-text', 
  RW: 'pos-f-text', 
  D: 'pos-d-text', 
  G: 'pos-g-text' 
}
