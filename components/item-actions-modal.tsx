import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { Modal, Pressable, View } from 'react-native';

export default function ItemActionsModal({
  visible,
  onClose,
  onResetZero,
  onSetHundred,
}: {
  visible: boolean;
  onClose: () => void;
  onResetZero: () => void;
  onSetHundred: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.35)',
          justifyContent: 'center',
          padding: 16,
        }}
        onPress={onClose}
      >
        <View
          style={{
            backgroundColor: 'rgba(30,30,30,0.98)',
            borderRadius: 12,
            padding: 12,
          }}
        >
          <ThemedText type="subtitle">Actions</ThemedText>

          <Pressable
            onPress={() => {
              onResetZero();
              onClose();
            }}
            style={{
              marginTop: 12,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
            }}
          >
            <ThemedText>Reset progress to 0%</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => {
              onSetHundred();
              onClose();
            }}
            style={{
              marginTop: 12,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
            }}
          >
            <ThemedText>Mark progress 100%</ThemedText>
          </Pressable>

          <Pressable
            onPress={onClose}
            style={{ marginTop: 8, paddingVertical: 8, alignItems: 'flex-end' }}
          >
            <ThemedText style={{ opacity: 0.8 }}>Cancel</ThemedText>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
