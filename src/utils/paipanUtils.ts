// 排盘工具函数
// 从BaziView.ts和TimeSettingModal.ts中提取的排盘相关工具函数
import { Paipan } from '../Paipan';

/**
 * 创建Paipan实例的便捷函数
 */
export function createPaipanInstance(timeCorrectionEnabled: boolean = false, longitude: number = 0, latitude: number = 0): Paipan {
    const paipan = new Paipan(timeCorrectionEnabled);
    paipan.J = longitude;
    paipan.W = latitude;
    return paipan;
}

/**
 * 获取天干的阴阳属性
 * true为阳，false为阴
 */
export function getGanYinYang(gan: string): boolean {
    const yangGan = ['甲', '丙', '戊', '庚', '壬'];
    return yangGan.includes(gan);
}

/**
 * 获取地支的阴阳属性
 * true为阳，false为阴
 */
export function getZhiYinYang(zhi: string): boolean {
    const yangZhi = ['子', '寅', '辰', '午', '申', '戌'];
    return yangZhi.includes(zhi);
}

/**
 * 检查干支是否匹配阴阳属性
 * 阳干配阳支，阴干配阴支
 */
export function checkGanZhiYinYangMatch(gan: string, zhi: string): boolean {
    const ganYang = getGanYinYang(gan);
    const zhiYang = getZhiYinYang(zhi);
    return ganYang === zhiYang;
}

/**
 * 获取天干列表
 */
export function getGanList(): string[] {
    return ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
}

/**
 * 获取地支列表
 */
export function getZhiList(): string[] {
    return ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
}

/**
 * 获取干支组合（六十甲子）
 */
export function getGanZhiList(): string[] {
    const ganList = getGanList();
    const zhiList = getZhiList();
    const ganZhiList: string[] = [];
    
    for (let i = 0; i < 60; i++) {
        const ganIndex = i % 10;
        const zhiIndex = i % 12;
        ganZhiList.push(`${ganList[ganIndex]}${zhiList[zhiIndex]}`);
    }
    
    return ganZhiList;
}

/**
 * 检查是否为有效的干支
 */
export function isValidGanZhi(ganZhi: string): boolean {
    if (ganZhi.length !== 2) return false;
    const gan = ganZhi[0];
    const zhi = ganZhi[1];
    if (!gan || !zhi) return false;
    return getGanList().includes(gan) && getZhiList().includes(zhi);
}

/**
 * 从八字结果中获取四柱显示文本
 */
export function formatFourPillars(bazi: { gztg: string[], dz: string[] }): string {
    if (!bazi.gztg || !bazi.dz || bazi.gztg.length < 4 || bazi.dz.length < 4) {
        return '';
    }
    
    const pillars = [
        `${bazi.gztg[0]}${bazi.dz[0]}`,
        `${bazi.gztg[1]}${bazi.dz[1]}`,
        `${bazi.gztg[2]}${bazi.dz[2]}`,
        `${bazi.gztg[3]}${bazi.dz[3]}`
    ];
    
    return `${pillars[0]}年 ${pillars[1]}月 ${pillars[2]}日 ${pillars[3]}时`;
}

/**
 * 检查时间是否需要校准（真太阳时）
 */
export function shouldApplyTimeCorrection(longitude: number): boolean {
    // 北京时间中心经度为120°E
    const beijingLongitude = 120;
    // 经度差超过1度可能需要校准
    return Math.abs(longitude - beijingLongitude) > 1;
}

/**
 * 计算时差（分钟）
 */
export function calculateTimeDifference(longitude: number): number {
    // 每度经度对应4分钟时差
    const beijingLongitude = 120;
    return (longitude - beijingLongitude) * 4;
}

/**
 * 格式化真太阳时显示
 */
export function formatTrueSolarTime(zty: { hour: number; minute: number; second: number } | undefined): string {
    if (!zty) return '';
    return `${String(zty.hour).padStart(2, '0')}:${String(zty.minute).padStart(2, '0')}:${String(zty.second).padStart(2, '0')}`;
}