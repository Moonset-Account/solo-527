import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CommonService {
  generateOrderNo(prefix = 'SUM'): string {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${ymd}${rand}`;
  }

  generateCode(prefix = 'CHK', len = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < len; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}${result}`;
  }

  generateQRCodeSVG(data: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <rect width="200" height="200" fill="#fff"/>
      <g fill="#1e3a8a">
        ${Array.from({ length: 20 }).map((_, r) =>
          Array.from({ length: 20 }).map((_, c) =>
            ((r * 7 + c * 13 + data.length) % 3 === 0 ||
             (r < 5 && c < 5) || (r < 5 && c > 14) || (r > 14 && c < 5))
              ? `<rect x="${10 + c * 9}" y="${10 + r * 9}" width="8" height="8"/>`
              : ''
          ).join('')
        ).join('')}
      </g>
      <text x="100" y="192" text-anchor="middle" font-size="10" fill="#1e3a8a" font-family="sans-serif">${data}</text>
    </svg>`;
  }

  calculateQualityScore(user: any, ticket: any, session: any): {
    channelScore: number; companyScore: number; positionScore: number;
    paymentSpeedScore: number; totalScore: number;
  } {
    const channelMap: Record<string, number> = {
      '官方网站': 85, '合作伙伴推荐': 95, '微信推广': 70,
      '行业媒体': 80, '地推活动': 65, 'direct': 75,
    };
    const posLevel: Record<string, number> = {
      'CEO': 100, 'CTO': 95, 'COO': 95, '创始人': 98, '联合创始人': 95,
      'VP': 90, '总监': 85, '负责人': 85, '院长': 90, '架构师': 80,
    };
    const companySizeScore = (user.company?.length || 5) > 8 ? 85 : 70;

    const channelScore = channelMap[user.channelSource] || channelMap['direct'];
    const companyScore = companySizeScore;
    const positionScore = Object.keys(posLevel).reduce(
      (acc, k) => (user.title?.includes(k) ? posLevel[k] : acc), 70
    );
    const ticketWeight = (ticket.level === 'vip') ? 1.15 : (ticket.level === 'guest') ? 1.25 : 1.0;
    const paymentSpeedScore = 90;
    const rawTotal = (channelScore * 0.25 + companyScore * 0.25 + positionScore * 0.3 + paymentSpeedScore * 0.2);
    const totalScore = Math.min(100, Math.round(rawTotal * ticketWeight * (session?.qualityWeight || 1)));
    return { channelScore, companyScore, positionScore, paymentSpeedScore, totalScore };
  }
}
