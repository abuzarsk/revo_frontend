import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { getTokenFromLocalStorage, STORAGE_KEYS } from '../../../../constants';
import { ensureMemberRole, readStoredJson, writeStoredJson } from './member-role';

interface MemberProfileData {
  name: string;
  email: string;
  phone: string;
  organization: string;
  location: string;
  interests: string;
  bio: string;
  avatar: string;
}

const PROFILE_KEY = 'revo-profile-member-v1';

@Component({
  selector: 'app-member-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './member-profile.html',
  styleUrl: './member.css',
})
export class MemberProfile implements OnInit {
  profile: MemberProfileData = this.blank();
  saved = '';
  message = '';
  error = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (!ensureMemberRole(this.router)) {
      return;
    }
    const user = getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ)?.user ?? {};
    const stored = readStoredJson(PROFILE_KEY, this.blank());
    this.profile = {
      ...this.blank(),
      name: stored.name || user.name || '',
      email: stored.email || user.email || '',
      phone: stored.phone || user.mobile || user.phone || '',
      organization: stored.organization || '',
      location: stored.location || '',
      interests: stored.interests || '',
      bio: stored.bio || '',
      avatar: stored.avatar || '',
    };
    this.saved = JSON.stringify(this.profile);
  }

  get dirty(): boolean {
    return JSON.stringify(this.profile) !== this.saved;
  }

  get completion(): number {
    const checks = [
      this.profile.name.trim().length >= 2,
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.profile.email),
      this.profile.phone.trim().length > 0,
      this.profile.location.trim().length > 0,
      this.profile.interests.trim().length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  get initials(): string {
    const parts = this.profile.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (this.profile.name || 'M').slice(0, 2).toUpperCase();
  }

  onPhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.error = 'Choose an image file.';
      return;
    }
    if (file.size > 1024 * 1024) {
      this.error = 'Profile images must be smaller than 1 MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.profile = { ...this.profile, avatar: reader.result };
        this.error = '';
        this.message = 'Photo updated. Save your profile to keep it.';
      }
    };
    reader.readAsDataURL(file);
  }

  clearPhoto(): void {
    this.profile = { ...this.profile, avatar: '' };
  }

  save(): void {
    if (this.profile.name.trim().length < 2) {
      this.error = 'Name must be at least 2 characters.';
      this.message = '';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.profile.email.trim())) {
      this.error = 'Enter a valid email address.';
      this.message = '';
      return;
    }
    this.profile = {
      ...this.profile,
      name: this.profile.name.trim(),
      email: this.profile.email.trim().toLowerCase(),
      phone: this.profile.phone.trim(),
      organization: this.profile.organization.trim(),
      location: this.profile.location.trim(),
      interests: this.profile.interests.trim(),
      bio: this.profile.bio.trim(),
    };
    writeStoredJson(PROFILE_KEY, this.profile);
    this.saved = JSON.stringify(this.profile);
    this.error = '';
    this.message = 'Profile saved in this browser.';
  }

  private blank(): MemberProfileData {
    return {
      name: '',
      email: '',
      phone: '',
      organization: '',
      location: '',
      interests: '',
      bio: '',
      avatar: '',
    };
  }
}
