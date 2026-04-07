import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { BASE_URL } from '@/constants/api';
import type { PatternResult, OhlcSummary } from '@/store/useTradeStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

interface Props {
  symbol: string;
  patterns: PatternResult[];
  ohlcSummary: OhlcSummary | null;
  onClose: () => void;
}

const SUGGESTED_PROMPTS = [
  'Is this a good entry?',
  'Explain the pattern',
  'What is the risk on this trade?',
  'What is the overall trend?',
];

/**
 * Bottom-sheet chat drawer that streams AI responses for the current chart.
 */
export function AIChatDrawer({ symbol, patterns, ohlcSummary, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed };
      const assistantId = (Date.now() + 1).toString();
      const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', isStreaming: true };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput('');
      setIsSending(true);

      try {
        const response = await fetch(`${BASE_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol,
            message: trimmed,
            patterns,
            ohlc_summary: ohlcSummary,
          }),
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') break;
              if (data.startsWith('[ERROR]')) {
                accumulated += `\n${data}`;
              } else {
                accumulated += data;
              }
            }

            const snapshot = accumulated;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: snapshot, isStreaming: true } : m,
              ),
            );
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: accumulated, isStreaming: false } : m,
          ),
        );
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: 'Error reaching the AI service. Is the backend running?', isStreaming: false }
              : m,
          ),
        );
      } finally {
        setIsSending(false);
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    },
    [symbol, patterns, ohlcSummary, isSending],
  );

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.drawer}
      >
        {/* Header */}
        <View style={styles.drawerHeader}>
          <View style={styles.handle} />
          <Text style={styles.drawerTitle}>AI Analyst — {symbol}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Suggested prompts (shown when no messages) */}
        {messages.length === 0 && (
          <View style={styles.suggestions}>
            {SUGGESTED_PROMPTS.map((p) => (
              <TouchableOpacity key={p} style={styles.suggestionChip} onPress={() => sendMessage(p)}>
                <Text style={styles.suggestionText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.aiText]}>
                {item.content}
                {item.isStreaming ? '▌' : ''}
              </Text>
            </View>
          )}
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask about the chart…"
            placeholderTextColor="#4b5563"
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
            editable={!isSending}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#0f0f0f" size="small" />
            ) : (
              <Text style={styles.sendBtnText}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  handle: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    left: '50%',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#374151',
  },
  drawerTitle: { flex: 1, color: '#f9fafb', fontWeight: '700', fontSize: 15 },
  closeBtn: { color: '#9ca3af', fontSize: 18 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14 },
  suggestionChip: {
    backgroundColor: '#1f2937',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#374151',
  },
  suggestionText: { color: '#d1d5db', fontSize: 13 },
  messageList: { flex: 1 },
  messageContent: { padding: 14, gap: 10 },
  bubble: { maxWidth: '85%', borderRadius: 12, padding: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#22d3ee' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#1f2937' },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#0f0f0f' },
  aiText: { color: '#f9fafb' },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  input: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f9fafb',
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sendBtn: {
    backgroundColor: '#22d3ee',
    borderRadius: 10,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#0f0f0f', fontSize: 20, fontWeight: '700' },
});
