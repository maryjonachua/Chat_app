import { Box, FormControl, IconButton, Input, Spinner, Text, useToast } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react'
import { ChatState } from '../Context/ChatProvider';
import ProfileModal from './miscellaneous/ProfileModal';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { getSender, getSenderFull } from '../config/ChatLogics';
import UpdateGroupChatModal from './miscellaneous/UpdateGroupChatModal';
import axios from 'axios';
import './style.css'
import ScrollableChat from './ScrollableChat';
import io from 'socket.io-client'


const ENDPOINT = "http://localhost:501"
var socket,selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
const [messages, setMessages] = useState([]);
const [loading, setLoading] = useState(false);
const [newMessage, setNewMessage] = useState("");
const [socketConnected, setSocketConnected] = useState(false);
const [typing, setTyping] = useState(false);
const [istyping, setIsTyping] = useState(false);
    const toast = useToast();
  
    const { selectedChat, setSelectedChat, user, notification, setNotification } =
      ChatState();
  
     const fetchMessages = async () => {
       if (!selectedChat) return;
  
       try {
         const config = {
           headers: {
             Authorization: `Bearer ${user.token}`,
           },
         };
  
         setLoading(true);
  
         axios.defaults.baseURL = 'http://localhost:501';
         const { data } = await axios.get(
           `/api/message/${selectedChat._id}`,
           config
        );
        console.log(messages)
        setMessages(data);
        setLoading(false);
  
   socket.emit("join chat", selectedChat._id);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to Load the Messages",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
      }
     };
  
    const sendMessage = async (event) => {
       if (event.key === "Enter" && newMessage) {
         socket.emit("stop typing", selectedChat._id);
        try {
          const config = {
            headers: {
              "Content-type": "application/json",
              Authorization: `Bearer ${user.token}`
            },
          };
          setNewMessage("")
          axios.defaults.baseURL = 'http://localhost:501';
          const { data } = await axios.post(
            "/api/message",
            {
              content: newMessage,
              chatId: selectedChat._id,
            },
            config
          );
        socket.emit("new message", data);
          //console.log(data)
           
           setMessages([...messages, data]);
         } catch (error) {
          toast({
            title: "Error Occured!",
            description: "Failed to send the Message",
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "top",
          });
        }
       }
    };
  
     useEffect(() => {
      socket = io(ENDPOINT);
      socket.emit("setup", user);
       socket.on("connected", () => setSocketConnected(true));
      socket.on("typing", () => setIsTyping(true));
      socket.on("stop typing", () => setIsTyping(false));
  
    
     }, []);
  
     useEffect(() => {
       fetchMessages();
  
    selectedChatCompare = selectedChat;
    
     }, [selectedChat]);
  
    useEffect(() => {
      socket.on("message recieved", (newMessageRecieved) => {
        if (
          !selectedChatCompare || // if chat is not selected or doesn't match current chat
          selectedChatCompare._id !== newMessageRecieved.chat._id
        ) {
          // if (!notification.includes(newMessageRecieved)) {
          //   setNotification([newMessageRecieved, ...notification]);
          //   setFetchAgain(!fetchAgain);
          // }
        } else {
          setMessages([...messages, newMessageRecieved]);
        }
      });
    });
  
    const typingHandler = (e) => {
      setNewMessage(e.target.value);
  
      if (!socketConnected) return;
  
      if (!typing) {
        setTyping(true);
        socket.emit("typing", selectedChat._id);
      }
      let lastTypingTime = new Date().getTime();
      var timerLength = 3000;

      setTimeout(() => {
        var timeNow = new Date().getTime();
        var timeDiff = timeNow - lastTypingTime;

        if (timeDiff >= timerLength && typing) {
          socket.emit("stop typing", selectedChat._id);
          setTyping(false);
        }
      }, timerLength);
    };
    

  return (
    <>
        {selectedChat? (
        <>
            <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />

            {!selectedChat.isGroupChat?(
                <>
                    {getSender(user, selectedChat.users)}
                  <ProfileModal
                    user={getSenderFull(user, selectedChat.users)}
                  />
                </>
            ):(<>
            {selectedChat.chatName.toUpperCase()}
            <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
            </>)}

          </Text>
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
            bg={'white'}
          >

            {loading? (<>
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
              </>
              ):(<>
                <div className="messages">
                <ScrollableChat messages={messages} /> 
              </div>
              
              </>)}
              <FormControl onKeyDown={sendMessage}
              id="first-name"
              isRequired
              mt={3} >
                 {istyping ? (
                <div height={50}
                width={70}
                fontSize={'20px'}
                style={{ marginBottom: 15, marginLeft: 0 }}>Typing...
                </div>
              ) : (<></>)
              }

                <Input variant="filled"
                bg="#E0E0E0"
                placeholder="Enter a message.."
                onChange={typingHandler}
                value={newMessage}/>
              </FormControl>
            


          </Box>
        
        
        </>):(
            
            
        <Box display="flex" alignItems="center" justifyContent="center" h="100%">
        <Text fontSize="3xl" pb={3} fontFamily="Work sans">
          Click on a user to start chatting
        </Text>
      </Box>
        )}
              
    </>
  )
}

export default SingleChat