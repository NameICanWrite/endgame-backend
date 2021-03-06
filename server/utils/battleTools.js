export function calculateHP(data) {
  const card0 = data.users[0].currentMove
  const card1 = data.users[1].currentMove

  let dmg0 = card1.attack - card0.defence
  let dmg1 = card0.attack - card1.defence

  if (dmg0 < 0) dmg0 = 0
  if (dmg1 < 0) dmg1 = 0

  data.users[0].hp -= dmg0
  data.users[1].hp -= dmg1

  return data
}


export function giveCards(user) {
  let cards = user.cards
  if (!Array.isArray(cards) || cards.length == 0) cards = []


  //add missing cards
  while (cards.length < 5) {
    let newCard = allCards[Math.floor(Math.random() * 20)]
    if (!cards.some(card => card.name == newCard.name)) cards.push(newCard)
  }

  //fill empty cards
  cards = cards.map((card, index, array) => {
    if (card.name) return card
    if (!card.name) return (() => {
      let newCard
      while (!newCard || array.some(currentCard => newCard?.name == currentCard.name)) {
        newCard = allCards[Math.floor(Math.random() * 20)]
      }
      return newCard
    })()
  })

  user.cards = cards
  return user
}


export const allCards = [{
    name: 'superman',
    defence: 19,
    attack: 9
  },
  {
    name: 'harry potter',
    defence: 7,
    attack: 0
  },
  {
    name: 'kirk',
    defence: 2,
    attack: 2
  },
  {
    name: 'skywalker',
    defence: 7,
    attack: 30
  },
  {
    name: 'Elon Musk',
    defence: 150,
    attack: 19
  },
  {
    name: 'Jesus Crist',
    defence: 2021,
    attack: 10
  },
  {
    name: 'naruto',
    defence: 2,
    attack: 3
  },
  {
    name: 'Rick and Morty',
    defence: 9,
    attack: 9
  },
  {
    name: 'Christopher Nolan',
    defence: 10,
    attack: 10
  },
  {
    name: 'Random Character',
    defence: Math.floor(Math.random() * 10),
    attack: Math.floor(Math.random() * 10)
  },
  {
    name: 'Not Defined Character',
    defence: undefined,
    attack: undefined
  },
  {
    name: 'Clone 1',
    defence: 19,
    attack: 9
  },
  {
    name: 'Clone 2',
    defence: 7,
    attack: 0
  },
  {
    name: 'Clone 3',
    defence: 2,
    attack: 2
  },
  {
    name: 'Clone 4',
    defence: 7,
    attack: 30
  },
  {
    name: 'Clone 5',
    defence: 150,
    attack: 19
  },
  {
    name: 'Clone 6',
    defence: 2021,
    attack: 10
  },
  {
    name: 'Clone 7',
    defence: 2,
    attack: 3
  },
  {
    name: 'Clone 8',
    defence: 9,
    attack: 9
  },
  {
    name: 'Clone 9',
    defence: 10,
    attack: 10
  },
]