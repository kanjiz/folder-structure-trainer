import type { Question } from '../models/FileSystem'

/**
 * フォルダ構造トレーニングの問題データ配列
 * 練習モード（practice）と演習モード（exercise）の問題が含まれます
 */
export const questions: Question[] = [
  {
    id: 'q001',
    title: '仕事のファイルを整理しよう',
    mode: 'practice',
    instructions: [
      '「報告書.docx」を「仕事」フォルダに入れてください',
      '「議事録.txt」を「仕事」フォルダの中の「会議」フォルダに入れてください',
      '「猫.jpg」を「プライベート」フォルダに入れてください',
    ],
    items: [
      { id: 'f1', name: '仕事', type: 'folder' },
      { id: 'f2', name: '会議', type: 'folder' },
      { id: 'f3', name: 'プライベート', type: 'folder' },
      { id: 'd1', name: '報告書.docx', type: 'file' },
      { id: 'd2', name: '議事録.txt', type: 'file' },
      { id: 'd3', name: '猫.jpg', type: 'file' },
    ],
    answer: {
      '仕事': {
        '会議': { '議事録.txt': null },
        '報告書.docx': null,
      },
      'プライベート': {
        '猫.jpg': null,
      },
    },
  },
  {
    id: 'q002',
    title: '学校のファイルを整理しよう',
    mode: 'exercise',
    instructions: [
      '以下のファイルを正しいフォルダに整理してください',
      '「読書感想文.docx」と「漢字テスト.pdf」は「国語」フォルダに入れてください',
      '「計算ドリル.xlsx」は「数学」フォルダの中の「宿題」フォルダに入れてください',
    ],
    items: [
      { id: 'f1', name: '国語', type: 'folder' },
      { id: 'f2', name: '数学', type: 'folder' },
      { id: 'f3', name: '宿題', type: 'folder' },
      { id: 'd1', name: '読書感想文.docx', type: 'file' },
      { id: 'd2', name: '計算ドリル.xlsx', type: 'file' },
      { id: 'd3', name: '漢字テスト.pdf', type: 'file' },
    ],
    answer: {
      '国語': {
        '読書感想文.docx': null,
        '漢字テスト.pdf': null,
      },
      '数学': {
        '宿題': { '計算ドリル.xlsx': null },
      },
    },
  },
]
