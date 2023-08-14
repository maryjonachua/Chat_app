import React from 'react'
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    useDisclosure,
    FormControl,
    Input,
    useToast,
    Box,
  } from "@chakra-ui/react";
  import axios from "axios";
  import { useState } from "react";
  import { ChatState } from "../../Context/ChatProvider";
import UserListItem from "../userAvatar/UserListItem";
import UserBadgeItem from '../userAvatar/UserBadgeItem';

export const GroupChatModal = ({children}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupChatName, setGroupChatName] = useState();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const { user, chats, setChats } = ChatState();

  const handleGroup = (userToAdd) => {
    if (selectedUsers.includes(userToAdd)) {
      toast({
        title: "User already added",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    setSelectedUsers([...selectedUsers, userToAdd]);
  };

//   search name to create grp chat
  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) {
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      axios.defaults.baseURL = 'http://localhost:501';

      const { data } = await axios.get(`/api/user?search=${search}`, config);
     
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

//   delete user you didn't want anymore to be add on the group chat
  const handleDelete = (delUser) => {
    setSelectedUsers(selectedUsers.filter((sel) => sel._id !== delUser._id));
  };

  const handleSubmit = async () => {
    if (!groupChatName || !selectedUsers) {
      toast({
        title: "Please fill all the feilds",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      axios.defaults.baseURL = 'http://localhost:501';

      const { data } = await axios.post(
        `/api/chat/group`,
        {
          name: groupChatName,
          users: JSON.stringify(selectedUsers.map((u) => u._id)),
        },
        config
      );
      setChats([data, ...chats]);
      onClose();
      toast({
        title: "New Group Chat Created!",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } catch (error) {
      toast({
        title: "Failed to Create the Chat!",
        description: error.response.data,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };


  return (
    <>
        <span onClick={onOpen}>{children}</span>

        <Modal onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent>
            <ModalHeader
            fontSize="35px"
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
            >
            Create Group Chat
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody display="flex" flexDir="column" alignItems="center">
            <FormControl>
                <Input
                placeholder="Chat Name"
                mb={3}
                onChange={(e) => setGroupChatName(e.target.value)}
                />
            </FormControl>
            <FormControl>
                <Input
                placeholder="Add Users"
                mb={1}
                onChange={(e) => handleSearch(e.target.value)}
                />
            </FormControl>
            <Box w="100%" d="flex" flexWrap="wrap">
                {selectedUsers.map((u) => (
                <UserBadgeItem
                    key={u._id}
                    user={u}
                    handleFunction={() => handleDelete(u)}
                />
                ))}
            </Box>
            {loading ? (
                
                <div>Loading...</div>
            ) : (
                searchResult
                ?.slice(0, 4)
                .map((user) => (
                    <UserListItem
                    key={user._id}
                    user={user}
                    handleFunction={() => handleGroup(user)}
                    />
                ))
            )}
            </ModalBody>
            <ModalFooter>
            <Button onClick={handleSubmit} colorScheme="blue">
                Create Chat
            </Button>
            </ModalFooter>
        </ModalContent>
        </Modal>
    </>
  )
}
export default GroupChatModal