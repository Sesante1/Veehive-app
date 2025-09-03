export type MessageType = {
  id: number;
  text: string;
  fromUser: boolean; // true if message is from current user, false if from other user
  timestamp: Date;
  time: string;
};

export type ConversationType = {
  id: number;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  lastMessage: string;
  time: string;
  timestamp: Date;
  messages: MessageType[];
};

export const CONVERSATIONS: ConversationType[] = [
  {
    id: 1,
    user: {
      name: "Boy Sipit",
      username: "boysipit",
      avatar:
        "https://i.pinimg.com/736x/e3/86/23/e38623cb61d5499381052b2a75a7f60a.jpg",
    },
    lastMessage: "Thanks for sharing that article! Really helpful insights.",
    time: "2h",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    messages: [
      {
        id: 1,
        text: "Tang ina mo boy",
        fromUser: false,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        time: "4h",
      },
      {
        id: 2,
        text: "Tang ina mo rin boy supot",
        fromUser: true,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        time: "4h",
      },
      {
        id: 3,
        text: "Napaka pangit mo boy",
        fromUser: true,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        time: "2h",
      },
    ],
  },
  {
    id: 2,
    user: {
      name: "Boy kneegrow",
      username: "boykneegrow",
      avatar:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7mPoWIcV-V4FlEoHOWZwOGrAdTKpjocR5RVSRm86OHXcksxOr",
    },
    lastMessage: "See you at the meetup tomorrow! Don't forget to bring your laptop.",
    time: "2d",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    messages: [
      {
        id: 1,
        text: "Are you planning to attend the React meetup this weekend?",
        fromUser: false,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        time: "3d",
      },
      {
        id: 2,
        text: "Yes! I've been looking forward to it. Should be great networking.",
        fromUser: true,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        time: "3d",
      },
      {
        id: 3,
        text: "See you at the meetup tomorrow! Don't forget to bring your laptop.",
        fromUser: false,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        time: "2d",
      },
    ],
  },
  {
    id: 3,
    user: {
      name: "Frank doe",
      username: "frankdoe",
      avatar:
        "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcT-IFX17ACaINJ2rOU_HmAWymlHLiL84OJFY8XGczPQqoWRROcJ",
    },
    lastMessage: "Great collaboration on the project. The demo was impressive!",
    time: "3d",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    messages: [
      {
        id: 1,
        text: "How's the progress on the mobile app project?",
        fromUser: false,
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        time: "4d",
      },
      {
        id: 2,
        text: "Going really well! Just finished the authentication flow. Want to see a demo?",
        fromUser: true,
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        time: "4d",
      },
      {
        id: 3,
        text: "Great collaboration on the project. The demo was impressive!",
        fromUser: false,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        time: "3d",
      },
    ],
  },
  {
    id: 4,
    user: {
      name: "Tung tung tung Sahur",
      username: "TungtungSahur",
      avatar:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFM5YJpen28exFqfXJ5AZlpdHQihC3HHosse_Ht6wF8PFG9ayg",
    },
    lastMessage: "The new designs look fantastic. When can we schedule a review?",
    time: "1w",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    messages: [
      {
        id: 1,
        text: "We've finished the initial mockups for your app. They're ready for review!",
        fromUser: false,
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        time: "1w",
      },
      {
        id: 2,
        text: "Awesome! Can't wait to see them. The timeline works perfectly.",
        fromUser: true,
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        time: "1w",
      },
      {
        id: 3,
        text: "The new designs look fantastic. When can we schedule a review?",
        fromUser: false,
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        time: "1w",
      },
    ],
  },
];
