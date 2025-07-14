import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Post = {
  id: string;
  text: string;
  createdAt: any;
  uid: string;
};

type Props = {
  post: Post;
  onComments: () => void;
  onReport: () => void;
};

export default function PostCard({ post, onComments, onReport }: Props) {
  return (
    <View className="bg-white rounded-lg p-4 mb-3 shadow"> 
      <Text className="text-base text-gray-800 mb-2">{post.text}</Text>
      <View className="flex-row justify-between items-center"> 
        <TouchableOpacity onPress={onComments} className="flex-row items-center"> 
          <Feather name="message-circle" size={18} color="#2563eb" />
          <Text className="text-blue-600 ml-1">Comentários</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onReport} className="flex-row items-center"> 
          <Feather name="alert-circle" size={18} color="#dc2626" />
          <Text className="text-red-600 ml-1">Denunciar</Text>
        </TouchableOpacity>
      </View>
      <Text className="text-xs text-gray-400 mt-2">{new Date(post.createdAt?.toDate?.() || post.createdAt).toLocaleString()}</Text>
    </View>
  );
} 