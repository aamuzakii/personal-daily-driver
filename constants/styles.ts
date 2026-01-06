import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  todoCard: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.25)',
  },
  todoList: {
    gap: 10,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: 'rgba(80,160,255,0.25)',
    borderColor: 'rgba(80,160,255,0.8)',
  },
  checkboxText: {
    fontSize: 14,
    lineHeight: 16,
  },
  todoTitleWrap: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
  },
  todoTitleDone: {
    opacity: 0.55,
    textDecorationLine: 'line-through',
  },
  scoreWrap: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  scoreInput: {
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.35)',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  weekCard: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.25)',
  },
  weekHint: {
    opacity: 0.7,
  },
  weekBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 2,
  },
  barCol: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  bar: {
    width: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(80,160,255,0.7)',
  },
  barValue: {
    fontSize: 12,
    opacity: 0.9,
    fontVariant: ['tabular-nums'],
  },
  barLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  refreshButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  weekGrid: {
    gap: 6,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekLabel: {
    opacity: 0.8,
  },
  weekValue: {
    fontVariant: ['tabular-nums'],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});